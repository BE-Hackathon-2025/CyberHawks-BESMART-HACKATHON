// src/api.js
import { auth } from "./firebaseConfig";

const ipAddress = "http://172.20.152.126:5000/api";
const localHost = "http://localhost:5000/api";
const API_BASE = "http://172.20.152.126:5000";

const API_URL = ipAddress;

async function authFetch(path, options = {}) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not authenticated");
  }

  // Get Firebase ID token (this proves identity to the backend)
  const idToken = await user.getIdToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    Authorization: `Bearer ${idToken}`,
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  //console.log("Response:", res);

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    // Token invalid, user probably deleted or session dead
    await signOut(auth);
    throw new Error("Your session has expired. Please log in again.");
  }

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

export function fetchMe() {
  return authFetch("/auth/me", { method: "GET" });
}

export function fetchFeatures(hub) {
  const query = hub ? `?hub=${encodeURIComponent(hub)}` : "";
  return authFetch(`/features${query}`, { method: "GET" });
}

export function createPost(hub, text, header) {
  return authFetch("/features", {
    method: "POST",
    body: JSON.stringify({ hub, text, header }),
  });
}

// Called after signup to create/sync the user document
export function syncUserProfile({ name, role, bio }) {
  return authFetch("/users", {
    method: "POST",
    body: JSON.stringify({ name, role, bio }),
  });
}

// Get the current user's profile document
export function fetchMyProfile() {
  return authFetch("/users/me", { method: "GET" });
}

// Update current user's profile (partial)
export function updateMyProfile(updates) {
  return authFetch("/users/me", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

// For AI routes (if you want to keep them unauthenticated)
export function sendAIQuery(message, sessionId) {
  return fetch(`${API_BASE}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, sessionId }),
  });
}
