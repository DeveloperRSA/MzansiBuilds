import { useEffect, useState } from "react";
import { getCelebrationWall, getFeed } from "./api";
import ProjectCard from "./components/ProjectCard";

export default function App() {
  const [feed, setFeed] = useState([]);
  const [celebration, setCelebration] = useState([]);

  useEffect(() => {
    getFeed().then(setFeed).catch(() => setFeed([]));
    getCelebrationWall().then(setCelebration).catch(() => setCelebration([]));
  }, []);

  return (
    <main>
      <header>
        <h1>MzansiBuilds</h1>
        <p>Build in public. Find collaborators. Celebrate shipped projects.</p>
      </header>

      <section>
        <h2>Live Feed</h2>
        <div className="grid">
          {feed.length ? (
            feed.map((project) => <ProjectCard key={project.id} project={project} />)
          ) : (
            <p>No projects yet. Start by creating your first build log.</p>
          )}
        </div>
      </section>

      <section>
        <h2>Celebration Wall 🎉</h2>
        <ul className="wall">
          {celebration.length ? (
            celebration.map((project) => (
              <li key={project.id}>
                {project.owner.username} completed <strong>{project.title}</strong>
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
