# server/app.py
import textFormatter  # Your new formatter module
from datetime import datetime, timedelta


from flask import Flask, request, jsonify
from flask_cors import CORS

#this is for AI integration
import os
import google.generativeai as genai
from collections import defaultdict
from dotenv import load_dotenv
load_dotenv()

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth, firestore

GLOBAL_FIRST_PROMPT = ""

# Generative AI API key setup
api_key = os.environ.get("GEMINI_API_KEY")
print(f"API Key loaded: {api_key is not None}")  # Debug print

if not api_key:
    print("ERROR: GEMINI_API_KEY environment variable is not set!")
    
genai.configure(api_key=api_key)
try:
      gemini_model = genai.GenerativeModel("gemini-2.5-flash")
      print("✅ Using model: gemini-2.5-flash")
except Exception as e:
    print(f"Model error: {e}")
    try:
        gemini_model = genai.GenerativeModel("gemini-2.0-flash")
        print("✅ Using model: gemini-2.0-flash")
    except Exception as e2:
        print(f"Fallback model error: {e2}")
        gemini_model = None


app = Flask(__name__)
# CORS(app, origins=["http://localhost:5173", "http://172.20.152.126:5000"], supports_credentials=True)

CORS(app, origins=[
    "http://localhost:5173",
    "http://172.20.152.126:5173", 
    "http://localhost:3000"
], supports_credentials=True)

# Initialize Firebase Admin with service account (backend only)
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()


def verify_firebase_token(req):
    """
    Extracts and verifies the Firebase ID token from Authorization header.
    Returns decoded token (dict) or None if invalid/missing.
    """
    auth_header = req.headers.get("Authorization", "")
    parts = auth_header.split()

    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    id_token = parts[1]

    try:
        decoded = firebase_auth.verify_id_token(id_token)
        return decoded
    except Exception:
        return None


def get_recent_posts_summary(hub="PA", post_limit=10):
    """
    Fetch recent posts and generate an AI summary
    """
    try:
        room_ref = db.collection("rooms").document(hub)
        posts_ref = room_ref.collection("posts")
        
        # Get recent posts (last 24 hours or limit)
        docs = posts_ref.order_by("createdAt", direction=firestore.Query.DESCENDING).limit(post_limit).stream()
        
        posts_content = []
        post_count = 0
        for doc in docs:
            post_data = doc.to_dict() or {}
            text = post_data.get("text", "").strip()
            header = post_data.get("header", "").strip()
            owner_email = post_data.get("ownerEmail", "Unknown")
            
            if text:  # Only include posts with actual content
                # Create a readable post entry
                if header:
                    post_entry = f"'{header}': {text} (by {owner_email})"
                else:
                    post_entry = f"{text} (by {owner_email})"
                
                posts_content.append(post_entry)
                post_count += 1
        
        print(f"📊 Found {post_count} posts in {hub} hub")
        
        if not posts_content:
            return "No recent posts found in this hub."
        
        # Prepare content for AI summarization
        posts_text = "\n".join([f"{i+1}. {post}" for i, post in enumerate(posts_content)])
        
        # AI prompt for summarization
        prompt = f"""
        You are an AI assistant that summarizes recent community posts for local hubs.
        Here are the recent posts from the {hub} hub:
        Recent Posts:
        {posts_text}
        
        
        When prompted Please provide:
        
        Format the response in clear, easy-to-read bullet points without markdown formatting.
        your first message should be a greeting for the user.
        prompt user to to ask a question about what kidns of things they are intrested in, or events they would like to attend and use that information for your recomendations.
        Be as clear and concise as possible and avoid any assumptions made by you.

        Please send a simple greeting and wait for the user to ask for your opinion on the posts.

        guidlines:
        - Start with a friendly greeting.
        - Summarize key topics and events discussed.
        - Highlight any questions or requests from the community.
        - Keep it brief and engaging.
          no more than 5 mid length sentences
        - keep information only relevent to the hub.
          DO not sue outside sources or assumptions
          STAY WITHIN 5 TO 7 SENTENCES DO NOT DEVIATE
        """

        GLOBAL_FIRST_PROMPT = prompt
        
        # Generate AI summary
        if gemini_model:
            response = gemini_model.generate_content(prompt)
            summary = response.text.strip()
            # Format the response
            summary = textFormatter.format_ai_response(summary)
            return summary
        else:
            # Mock response when AI is not available
            return f"Found {len(posts_content)} recent posts in {hub} hub. Topics include: {', '.join(posts_content[:3])}..."
            
    except Exception as e:
        print(f"Error generating posts summary: {e}")
        return f"Unable to generate summary at this time: {str(e)}"


@app.route("/")
def home():
    return "Hello"


@app.route("/api/auth/me", methods=["GET", "OPTIONS"])
def me():
    # CORS preflight
    if request.method == "OPTIONS":
        return "", 200

    decoded = verify_firebase_token(request)
    if not decoded:
        return jsonify({"error": "Unauthorized"}), 401

    uid = decoded.get("uid")
    email = decoded.get("email")
    name = decoded.get("name") or email
    role = None

    # Try to fetch extra profile info (role, name) from Firestore
    try:
        # NOTE: collection name "users" matches Login.jsx setDoc
        user_doc_ref = db.collection("Users").document(uid)
        user_doc = user_doc_ref.get()
        if user_doc.exists:
            user_data = user_doc.to_dict() or {}
            role = (
                user_data.get("Role")
                or user_data.get("role")
                or role
            )

            if user_data.get("Name") or user_data.get("name"):
                name = user_data.get("Name") or user_data.get("name")

            if user_data.get("Email"):
                email = user_data.get("Email")
    except Exception:
        # If Firestore read fails, just fall back to auth info
        pass

    return jsonify(
        {
            "user": {
                "uid": uid,
                "email": email,
                "name": name,
                "role": role,
            }
        }
    ), 200


@app.route("/api/features", methods=["GET", "POST", "OPTIONS"])
def features():
    # CORS preflight
    if request.method == "OPTIONS":
        return "", 200

    decoded = verify_firebase_token(request)
    if not decoded:
        return jsonify({"error": "Unauthorized"}), 401

    email = decoded.get("email")
    uid = decoded.get("uid")

    # Normalize hub value (PA | UM | HS)
    def normalize_hub(raw):
        if not raw:
            return None
        val = str(raw).upper()
        return val if val in ["PA", "UM", "HS"] else None

    if request.method == "POST":
        # Create a new post in Firestore under rooms/{hub}/posts
        data = request.get_json() or {}
        text = (data.get("text") or "").trim() if hasattr(str, "trim") else (data.get("text") or "").strip()
        head = (data.get("header") or "").strip()
        hub = normalize_hub(data.get("hub")) or "PA"

        if not text:
            return jsonify({"error": "Text is required"}), 400

        try:
            room_ref = db.collection("rooms").document(hub)
            # Ensure the room document exists
            room_ref.set({"hub": hub}, merge=True)

            post_ref = room_ref.collection("posts").document()
            post_ref.set(
                {
                    "text": text,
                    "header": head,
                    "hub": hub,
                    "ownerEmail": email,
                    "ownerUid": uid,
                    "createdAt": firestore.SERVER_TIMESTAMP,
                }
            )
            return jsonify({"id": post_ref.id, "message": "Post created"}), 201
        except Exception as e:
            return jsonify({"error": f"Failed to create post: {e}"}), 500

    # GET: read posts from rooms/{hub}/posts
    hub_param = normalize_hub(request.args.get("hub")) or "PA"
    try:
        room_ref = db.collection("rooms").document(hub_param)
        posts_ref = room_ref.collection("posts")

        # Order newest first (all docs written by this API have createdAt)
        docs = posts_ref.order_by(
            "createdAt", direction=firestore.Query.DESCENDING
        ).stream()

        features_list = []
        for doc in docs:
            d = doc.to_dict() or {}
            text = d.get("text") or ""
            features_list.append(
                {
                    "id": doc.id,
                    # for compatibility with Dashboard
                    "title": text[:60] or "Community item",
                    "owner": d.get("ownerEmail") or email,
                    "hub": d.get("hub") or hub_param,
                    "description": text,
                    "header": d.get("header") or "",
                    "createdAt": d.get("createdAt").isoformat()
                    if d.get("createdAt")
                    else None,
                }
            )

        # # If no Firestore data yet, return a couple of prototype items
        # if not features_list:
        #     features_list = [
        #         {
        #             "id": "demo-1",
        #             "title": f"{hub_param} Community Kickoff",
        #             "owner": email,
        #             "hub": hub_param,
        #             "description": f"Prototype post for {hub_param}. Use the input box to create real ones.",
        #             "createdAt": None,
        #         },
        #         {
        #             "id": "demo-2",
        #             "title": f"{hub_param} Local Deals & Events",
        #             "owner": email,
        #             "hub": hub_param,
        #             "description": "Another placeholder item so the UI has something to show.",
        #             "createdAt": None,
        #         },
        #     ]

        return jsonify({"features": features_list}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to load posts: {e}"}), 500



@app.route("/api/userUpdate", methods=["POST", "GET", "OPTIONS"])
def users_collection():
    # CORS preflight
    if request.method == "OPTIONS":
        return "", 200

    decoded = verify_firebase_token(request)
    if not decoded:
        return jsonify({"error": "Unauthorized"}), 401

    uid = decoded.get("uid")
    email = decoded.get("email")

    if request.method == "POST":
        # CREATE / SYNC: called right after signup or when updating base profile
        data = request.get_json() or {}
        name = (data.get("name") or data.get("Name") or "").strip()
        role = (data.get("role") or data.get("Role") or "").strip()
        bio = (data.get("bio") or "").strip()

        # Optional role validation
        allowed_roles = {"student", "resident", "business"}
        normalized_role = role.lower() if role else None
        if normalized_role and normalized_role not in allowed_roles:
            return jsonify(
                {
                    "error": "Invalid role",
                    "allowedRoles": list(allowed_roles),
                }
            ), 400

        try:
            user_doc_ref = db.collection("Users").document(uid)
            write_data = {
                "uid": uid,
                "Email": email,
            }

            if name:
                write_data["Name"] = name
            if normalized_role:
                write_data["Role"] = normalized_role
            if bio:
                write_data["bio"] = bio

            # Merge so we don't blow away existing fields
            user_doc_ref.set(write_data, merge=True)

            return jsonify(
                {
                    "message": "User synced",
                    "user": write_data,
                }
            ), 200
        except Exception as e:
            return jsonify({"error": f"Failed to sync user: {e}"}), 500

    # GET /api/users -> list users (optional filter)
    role_filter = request.args.get("role")
    try:
        query = db.collection("Users")
        if role_filter:
            # match your stored lowercase role
            query = query.where("Role", "==", role_filter.lower())

        docs = query.stream()
        users = []
        for doc in docs:
            d = doc.to_dict() or {}
            users.append(
                {
                    "uid": d.get("uid") or doc.id,
                    "name": d.get("Name") or d.get("name"),
                    "email": d.get("Email"),
                    "role": d.get("Role") or d.get("role"),
                    "bio": d.get("bio"),
                }
            )

        return jsonify({"users": users}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to load users: {e}"}), 500


#This api gets the user's current document to either update or read.
@app.route("/api/users/me", methods=["GET", "PATCH", "OPTIONS"])
def user_me():
    # CORS preflight
    if request.method == "OPTIONS":
        return "", 200

    decoded = verify_firebase_token(request)
    if not decoded:
        return jsonify({"error": "Unauthorized"}), 401

    uid = decoded.get("uid")
    email = decoded.get("email")

    user_doc_ref = db.collection("Users").document(uid)

    if request.method == "GET":
        try:
            doc = user_doc_ref.get()
            if not doc.exists:
                return jsonify({"error": "User not found"}), 404

            d = doc.to_dict() or {}
            return jsonify(
                {
                    "user": {
                        "uid": d.get("uid") or uid,
                        "name": d.get("Name") or d.get("name"),
                        "email": d.get("Email") or email,
                        "role": d.get("Role") or d.get("role"),
                        "bio": d.get("bio"),
                    }
                }
            ), 200
        except Exception as e:
            return jsonify({"error": f"Failed to load user: {e}"}), 500

    # PATCH: partial update
    data = request.get_json() or {}
    updates = {}

    if "name" in data or "Name" in data:
        name = (data.get("name") or data.get("Name") or "").strip()
        updates["Name"] = name

    if "role" in data or "Role" in data:
        role = (data.get("role") or data.get("Role") or "").strip()
        allowed_roles = {"student", "resident", "business"}
        normalized_role = role.lower() if role else None
        if normalized_role and normalized_role not in allowed_roles:
            return jsonify({"error": "Invalid role"}), 400
        updates["Role"] = normalized_role

    if "bio" in data:
        updates["bio"] = (data.get("bio") or "").strip()

    if not updates:
        return jsonify({"message": "No changes"}), 200

    try:
        user_doc_ref.set(updates, merge=True)
        return jsonify({"message": "User updated", "updates": updates}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update user: {e}"}), 500


#---------------------------------------------------------
# AI integration endpoints can go here
chat_histories = defaultdict(list)


@app.route("/api/ai/chat", methods=["POST", "OPTIONS"])
def ai_chat():
    # CORS preflight
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json() or {}
    message = (data.get("message") or "").strip()
    session_id = (data.get("sessionId") or "default").strip() or "default"

    if not message:
        return jsonify({"error": "Message is required"}), 400

    history = chat_histories[session_id]

    # Build a text prompt from history
    # (You can make this fancier later with real role separation)
    prompt_lines = [GLOBAL_FIRST_PROMPT] if GLOBAL_FIRST_PROMPT else []
    for m in history:
        prefix = "User" if m["role"] == "user" else "Assistant"
        prompt_lines.append(f"{prefix}: {m['content']}")
    prompt_lines.append(f"User: {message}")
    prompt_lines.append("Assistant:")

    prompt_text = "\n".join(prompt_lines)

    try:
        print(f"Sending prompt to Gemini: {prompt_text[:100]}...")  # Debug
        gemini_response = gemini_model.generate_content(prompt_text)
        reply_text = gemini_response.text.strip()
        formatted_response = textFormatter.format_ai_response(reply_text)
        print(f"Formatted AI response")
    except Exception as e:
        print("Gemini error:", e)
         # More specific error handling
        if "API_KEY_INVALID" in str(e):
            return jsonify({"error": "Invalid Gemini API key"}), 500
        elif "quota" in str(e).lower():
            return jsonify({"error": "API quota exceeded"}), 500
        elif "429" in str(e):
            return jsonify({"error": "Rate limit exceeded"}), 429
        else:
            return jsonify({"error": f"AI service failed: {str(e)}"}), 500

    # Update in-memory history
    history.append({"role": "user", "content": message})
    history.append({"role": "assistant", "content": reply_text})

    # Return the full history to the client
    return jsonify({
        "messages": history,
        "response": reply_text  # Also return the latest response for easy access
    }), 200

@app.route("/api/posts/summary", methods=["GET", "OPTIONS"])
def get_posts_summary():
    """
    Get AI summary of recent posts for a hub
    """
    if request.method == "OPTIONS":
        return "", 200

    # Optional: Add authentication if needed
    # decoded = verify_firebase_token(request)
    # if not decoded:
    #     return jsonify({"error": "Unauthorized"}), 401

    hub = request.args.get("hub", "PA")
    
    try:
        summary = get_recent_posts_summary(hub)
        return jsonify({
            "summary": summary,
            "hub": hub,
            "generated_at": datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to generate summary: {str(e)}"}), 500
    

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
