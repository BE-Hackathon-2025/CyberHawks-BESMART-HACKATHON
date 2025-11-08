// src/Login.jsx
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { syncUserProfile } from "./api";

//Step 1 for password checker: validation commponent function
function validatePassword(password) {
  const minLength = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid:
      minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
    minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
  };
}

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [role, setRole] = useState(""); // "student" | "resident" | "business"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  //step 2 for password checker: the return passward validation state
  const [passwordValidation, setPasswordValidation] = useState({
    isValid: true,
    minLength: true,
    hasLowerCase: true,
    hasUpperCase: true,
    hasNumber: true,
    hasSpecialChar: true,
  });

  const isLogin = mode === "login";

  //step 3 for password checker:password change handler
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    if (!isLogin && newPassword) {
      setPasswordValidation(validatePassword(newPassword));
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    //Step 4 for password checker: add password validation for registration
    if (!isLogin && !passwordValidation.isValid) {
      setError("Password does not meet the required criteria.");
      return;
    }

    setLoading(true);
    console.log("Form submitted with:", { name, role, email, password });
    try {
      if (isLogin) {
        // Login flow: email + password
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Register flow
        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const displayName = name.trim() || email;

        // Update Firebase Auth profile with display name
        await updateProfile(cred.user, { displayName });

        // Store extra user data (role, etc.) in Firestore
        await setDoc(doc(db, "Users", cred.user.uid), {
          uid: cred.user.uid,
          Name: name,
          Email: email,
          Role: role, // student | resident | business
          createdAt: serverTimestamp(),
        });

        // after updateProfile:
        await syncUserProfile({
          name,
          role, // "student" | "resident" | "business"
          bio: "", // or later from Bio_form
        });
      }
      // onAuthStateChanged in App.jsx will handle redirect after auth
    } catch (err) {
      console.error(err);
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-card-header">
          <h2>{isLogin ? "Welcome!" : "Create your account"}</h2>
          <p className="subtitle">
            Connect students, residents, and businesses in your college town.
          </p>
        </div>

        {!isLogin && (
          <div className="role-section">
            <div className="role-label">I am a...</div>
            <div className="role-toggle">
              <button
                type="button"
                className={
                  "role-pill" + (role === "student" ? " role-pill-active" : "")
                }
                onClick={() => setRole("student")}
              >
                Student
              </button>
              <button
                type="button"
                className={
                  "role-pill" + (role === "resident" ? " role-pill-active" : "")
                }
                onClick={() => setRole("resident")}
              >
                Resident
              </button>
              <button
                type="button"
                className={
                  "role-pill" + (role === "business" ? " role-pill-active" : "")
                }
                onClick={() => setRole("business")}
              >
                Business
              </button>
            </div>
            <p className="role-caption">
              Your role helps the AI personalize your community feed.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name" style={{ color: "#ffffff" }}>
                Name
              </label>
              <input
                id="name"
                type="text"
                style={{
                  backgroundColor: "#1c1c1c",
                  border: "1px solid #444444",
                }}
                placeholder="Your name or organization"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" style={{ color: "#ffffff" }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              style={{
                backgroundColor: "#1c1c1c",
                border: "1px solid #444444",
              }}
              placeholder={
                role === "student"
                  ? "you@umes.edu"
                  : role === "resident"
                  ? "your@gmail.com"
                  : "business@gmail.com"
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" style={{ color: "#ffffff" }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              style={{
                backgroundColor: "#1c1c1c",
                border: "1px solid #444444",
              }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
            />
          </div>

          {!isLogin && password && (
            <div className="password-requirements">
              <div
                className={passwordValidation.minLength ? "valid" : "invalid"}
              >
                {passwordValidation.minLength ? "yes" : "no"} At least 6
                characters
              </div>
              <div
                className={passwordValidation.hasLowerCase ? "valid" : "invalid"}
              >
                {passwordValidation.hasLowerCase ? "yes" : "no"} Contains a lowercase letter
              </div>
              <div
                className={passwordValidation.hasUpperCase ? "valid" : "invalid"}
              >
                {passwordValidation.hasUpperCase ? "yes" : "no"} Contains a uppercase letter
              </div>
              <div
                className={passwordValidation.hasNumber ? "valid" : "invalid"}
              >
                {passwordValidation.hasNumber ? "yes" : "no"} Contains a number
              </div>
              <div
                className={
                  passwordValidation.hasSpecialChar ? "valid" : "invalid"
                }
              >
                {passwordValidation.hasSpecialChar ? "yes" : "no"} Contains a
                special character
              </div>
            </div>
          )}
          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={loading} className="primary-btn">
            {loading
              ? "Please wait..."
              : isLogin
              ? "Login"
              : "Sign up & join the hub"}
          </button>
        </form>

        <div className="switch-mode">
          {isLogin ? (
            <>
              <span>New to UniTown?</span>
              <button
                type="button"
                onClick={() => setMode("register")}
                className="link-btn"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              <span>Already have an account?</span>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="link-btn"
              >
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
