// src/App.jsx
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Bio_form from "./components/Bio_form";
import postform from "./components/postform";
import Posts from "./components/posts";
import { fetchMe } from "./api";
import "./App.css";

function App() {
  const [user, setUser] = useState([]);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasBio, setHasBio] = useState(false);
  const [posts, setPosts] = useState([]);

  const handleAddPosts = (post) => {
    setPosts([post, ...posts]);
  };

  useEffect(() => {
    // newest code: 20:42 -> posts
    //   //ends

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser([]);
        setCheckingAuth(false);
        return;
      }

      try {
        // Optional: hit backend to get normalized user info
        const data = await fetchMe();
        setUser(data.user);
      } catch {
        // If backend fails, at least use Firebase user
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName || fbUser.email,
          role: fbUser.role,
        });
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsub();
  }, [auth]);

  async function handleLogout() {
    console.log(auth);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  if (checkingAuth) {
    return (
      <div className="center-screen">
        <p>Checking session...</p>
      </div>
    );
  }

  if (!auth.currentUser) {
    return <Login user={user} set={setUser} />;
  }

  return (
    <>
      <Dashboard user={user} onLogout={handleLogout} />
    </>
  );

  return (
    <div className="app-container">
      <postform onSubmit={handleAddPosts} />
      <posts posts={posts} />
    </div>
  );
}

export default App;
