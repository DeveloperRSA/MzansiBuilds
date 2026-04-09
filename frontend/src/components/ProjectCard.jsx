export default function ProjectCard({ project }) {
  return (
    <article className="card">
      <p className="meta">@{project.owner.username}</p>
      <h3>{project.title}</h3>
      <p>{project.description}</p>
      <p>
        <strong>Stage:</strong> {project.stage}
      </p>
      <p>
        <strong>Support:</strong> {project.support_needed}
      </p>
      <div className="actions">
        <button type="button">Comment</button>
        <button type="button">Raise Hand</button>
      </div>
    </article>
  );
}
