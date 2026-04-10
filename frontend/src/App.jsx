import { useEffect, useState } from "react";
import { getCelebrationWall, getFeed } from "./api";
import ProjectCard from "./components/ProjectCard";
import TeamWorkspace from "./components/TeamWorkspace";
import "./App.css";

// Main screen for MzansiBuilds.
// I kept this component intentionally simple and readable so any teammate can maintain it.
export default function App() {
  // Live feed items from everyone on the platform.
  const [feed, setFeed] = useState([]);

  // Completed projects for the celebration wall.
  const [celebration, setCelebration] = useState([]);

  // Basic UX states so users don't see a blank page while data loads.
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Wrapped in its own async function because useEffect itself can't be async.
    const loadHomeData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        // Fetch both sections at once so the page feels faster.
        const [feedData, celebrationData] = await Promise.all([
          getFeed(),
          getCelebrationWall(),
        ]);

        setFeed(feedData);
        setCelebration(celebrationData);
      } catch (error) {
        console.error("Home page request failed", error);
        setErrorMessage("Could not load data right now. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  if (loading) {
    return <div className="loading-state">Fetching projects...</div>;
  }

  return (
    <main className="main-container">
      <header className="hero-section">
        <h1>MzansiBuilds</h1>
        <p>Build in public. Find collaborators. Celebrate shipped projects.</p>
      </header>

      {errorMessage ? <p className="error-msg">{errorMessage}</p> : null}

      <section className="feed-wrapper">
        <h2>Live Feed</h2>
        <div className="project-grid">
          {feed.length > 0 ? (
            feed.map((project) => <ProjectCard key={project.id} project={project} />)
          ) : (
            <p>No projects yet. Start by creating your first build log.</p>
          )}
        </div>
      </section>

      {/* Divider helps visually separate personal feed from team collaboration tools. */}
      <hr className="divider" />
      <TeamWorkspace />
      <hr className="divider" />

      <section className="celebration-section">
        <h2>Celebration Wall 🎉</h2>
        <ul className="wall-list">
          {celebration.length > 0 ? (
            celebration.map((project) => (
              <li key={project.id} className="wall-item">
                <span className="user-bold">{project.owner.username}</span> completed <strong>{project.title}</strong>
              </li>
            ))
          ) : (
            <li>No completed projects yet.</li>
          )}
        </ul>
      </section>
    </main>
  );
}
