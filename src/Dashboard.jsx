// src/Dashboard.jsx
import { useEffect, useState } from "react";
import { fetchFeatures, createPost } from "./api";
import { FaPaperPlane } from "react-icons/fa";
import AI_Queary from "./components/AI_Queary";
import Post from "./components/posts";

export default function Dashboard({ user, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [newPost, setNewPost] = useState([]);
  const [newHeader, setNewHeader] = useState("");
  const [activeServer, setActiveServer] = useState("PA"); // PA | UM | HS
  const [isExpanded, setIsExpanded] = useState(false);

  const servers = [
    { id: "PA", label: "PA", name: "Princess Anne" },
    { id: "UM", label: "UM", name: "UMES" },
    { id: "BS", label: "BS", name: "Businesses" },
  ];

  const activeServerConfig =
    servers.find((s) => s.id === activeServer) || servers[0];

  async function loadFeed(hub) {
    setLoading(true);
    setError("");
    try {
      const data = await fetchFeatures(hub);
      setPosts(data.features || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Load posts for the active hub
    loadFeed(activeServer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeServer]);

  async function handleCreatePost(e) {
    e.preventDefault();
    const text = newPost.trim();
    const head = newHeader.trim();
    if (!text) return;

    try {
      setPosting(true);
      setError("");
      await createPost(activeServer, text, head);

      setNewPost([]);
      // Reload feed for this hub
      await loadFeed(activeServer);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create post");
    } finally {
      setPosting(false);
    }
  }

  return (
    <>
      <div className="app-shell discord-shell">
        {/* LEFT: Hubs/Servers column. Lines 70 - 76 & 87 provided by Github copilot */}
        <aside className={`sidebar-servers ${isExpanded ? "expanded" : ""}`}>
          <button
            className="sidebar-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "←" : "→"}
          </button>
          {servers.map((server) => (
            <button
              key={server.id}
              className={
                "server-pill" +
                (activeServer === server.id ? " server-pill-active" : "")
              }
              onClick={() => setActiveServer(server.id)}
            >
              <span>{server.label}</span>
              {isExpanded && <span className="server-name">{server.name}</span>}
            </button>
          ))}
          <div className="server-separator" />
        </aside>

        {/* RIGHT: Main content (Feed + AI panel) */}
        <main className="main-panel">
          <header className="main-header">
            <div className="main-header-left">
              <h2 className="main-header-title">
                {activeServerConfig.name} Hub
              </h2>
              <span className="main-header-subtitle">
                Local posts, events, and deals.
              </span>
            </div>
            <div className="main-header-right">
              <span className="main-header-user">
                {user?.name || user?.email || "New User"}
              </span>
              <button
                className="secondary-btn main-header-logout"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          </header>

          <section className="content-split">
            {/* LEFT: Feed / posts for this hub */}
            <section className="feed-wrapper feed-wrapper-main">
              <div className="feed-scroller">
                {loading && (
                  <p className="feed-status">Loading community feed...</p>
                )}
                {error && !loading && (
                  <p className="feed-status feed-status-error">{error}</p>
                )}
                {!loading && !error && posts.length === 0 && (
                  <p className="feed-status">
                    No posts yet in this prototype. Imagine real posts from{" "}
                    {activeServerConfig.name} appearing here.
                  </p>
                )}

                {!loading &&
                  !error &&
                  posts.map((post) => <Post key={post.id} post={post} />)}
              </div>

              <form className="composer" onSubmit={handleCreatePost}>
                <input
                  className="composer-input"
                  type="text"
                  placeholder="Enter Header"
                  onChange={(e) => setNewHeader(e.target.value)}
                />

                <hr />
                <input
                  className="composer-input"
                  placeholder={`Share something with ${activeServerConfig.name}`}
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                />
                <button
                  className="composer-btn"
                  type="submit"
                  //disabled={posting || !newPost.trim()}
                >
                  {posting ? "Posting..." : <FaPaperPlane />}
                </button>
              </form>
            </section>
            {/* RIGHT: AI insights panel (frontend only for now) */}
            <aside className="ai-panel sidebar-servers-right">
              <AI_Queary activeHub={activeServer} />
            </aside>
          </section>
        </main>
      </div>
    </>
  );
}
