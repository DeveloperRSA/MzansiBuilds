import { useEffect, useState } from "react";
import {
  addTeamProjectUpdate,
  createTeam,
  createTeamProject,
  getTeamActivity,
  getTeamMembers,
  getTeamProjects,
  joinTeam,
  listTeams,
} from "../api";

// Team categories requested by challenge brief.
const TEAM_TYPES = ["hackathon", "student_group", "startup", "general"];

// Team workspace focuses on practical collaboration flows first.
// Future enhancements (invites, stronger RBAC, dashboards) can plug into this structure.
export default function TeamWorkspace() {
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState("");

  const [teamForm, setTeamForm] = useState({ owner_id: "", name: "", description: "", team_type: "general" });
  const [joinForm, setJoinForm] = useState({ user_id: "", role: "member" });
  const [projectForm, setProjectForm] = useState({
    user_id: "",
    title: "",
    description: "",
    stage: "building",
    support_needed: "collaborators",
  });
  const [updateForm, setUpdateForm] = useState({ user_id: "", project_id: "", milestone: "" });

  async function loadTeams() {
    try {
      const data = await listTeams();
      setTeams(data);
      if (!selectedTeamId && data.length) {
        setSelectedTeamId(String(data[0].id));
      }
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  async function loadTeamDetails(teamId) {
    if (!teamId) return;

    try {
      const [memberData, projectData, activityData] = await Promise.all([
        getTeamMembers(teamId),
        getTeamProjects(teamId),
        getTeamActivity(teamId),
      ]);
      setMembers(memberData);
      setProjects(projectData);
      setActivity(activityData);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      loadTeamDetails(selectedTeamId);
    }
  }, [selectedTeamId]);

  async function handleCreateTeam(event) {
    event.preventDefault();
    setError("");

    try {
      await createTeam({ ...teamForm, owner_id: Number(teamForm.owner_id) });
      setTeamForm({ owner_id: "", name: "", description: "", team_type: "general" });
      await loadTeams();
    } catch (createError) {
      setError(createError.message);
    }
  }

  async function handleJoinTeam(event) {
    event.preventDefault();
    setError("");

    try {
      await joinTeam(selectedTeamId, { ...joinForm, user_id: Number(joinForm.user_id) });
      setJoinForm({ user_id: "", role: "member" });
      await loadTeamDetails(selectedTeamId);
    } catch (joinError) {
      setError(joinError.message);
    }
  }

  async function handleCreateProject(event) {
    event.preventDefault();
    setError("");

    try {
      await createTeamProject(selectedTeamId, {
        ...projectForm,
        user_id: Number(projectForm.user_id),
      });
      setProjectForm({
        user_id: "",
        title: "",
        description: "",
        stage: "building",
        support_needed: "collaborators",
      });
      await loadTeamDetails(selectedTeamId);
    } catch (projectError) {
      setError(projectError.message);
    }
  }

  async function handleAddUpdate(event) {
    event.preventDefault();
    setError("");

    try {
      await addTeamProjectUpdate(selectedTeamId, Number(updateForm.project_id), {
        user_id: Number(updateForm.user_id),
        milestone: updateForm.milestone,
      });
      setUpdateForm({ user_id: "", project_id: "", milestone: "" });
      await loadTeamDetails(selectedTeamId);
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  return (
    <section>
      <h2>Team Collaboration</h2>
      <p>Support hackathons, student groups, startup teams, and general collaborative projects.</p>
      {error ? <p className="error">{error}</p> : null}

      <div className="team-layout">
        <form className="card" onSubmit={handleCreateTeam}>
          <h3>Create Team</h3>
          <input
            placeholder="Owner user ID"
            value={teamForm.owner_id}
            onChange={(event) => setTeamForm((prev) => ({ ...prev, owner_id: event.target.value }))}
          />
          <input
            placeholder="Team name"
            value={teamForm.name}
            onChange={(event) => setTeamForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <input
            placeholder="Team description"
            value={teamForm.description}
            onChange={(event) => setTeamForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <select
            value={teamForm.team_type}
            onChange={(event) => setTeamForm((prev) => ({ ...prev, team_type: event.target.value }))}
          >
            {TEAM_TYPES.map((teamType) => (
              <option key={teamType} value={teamType}>
                {teamType}
              </option>
            ))}
          </select>
          <button type="submit">Create Team</button>
        </form>

        <article className="card">
          <h3>Teams</h3>
          <select value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)}>
            <option value="">Select a team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} ({team.team_type})
              </option>
            ))}
          </select>

          <form onSubmit={handleJoinTeam}>
            <h4>Join Team</h4>
            <input
              placeholder="Your user ID"
              value={joinForm.user_id}
              onChange={(event) => setJoinForm((prev) => ({ ...prev, user_id: event.target.value }))}
            />
            <select value={joinForm.role} onChange={(event) => setJoinForm((prev) => ({ ...prev, role: event.target.value }))}>
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
            <button type="submit" disabled={!selectedTeamId}>
              Join
            </button>
          </form>
        </article>
      </div>

      <div className="team-layout">
        <article className="card">
          <h3>Team Members & Roles</h3>
          <ul>
            {members.map((membership) => (
              <li key={membership.id}>
                {membership.user.username} — <strong>{membership.role}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h3>Team Projects</h3>
          <ul>
            {projects.map((project) => (
              <li key={project.id}>
                <strong>{project.title}</strong> ({project.stage})
                <ul>
                  {project.updates.map((update) => (
                    <li key={update.id}>
                      {update.milestone} — {update.author?.username || "member"}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="team-layout">
        <form className="card" onSubmit={handleCreateProject}>
          <h3>Create Team Project</h3>
          <input
            placeholder="Your user ID"
            value={projectForm.user_id}
            onChange={(event) => setProjectForm((prev) => ({ ...prev, user_id: event.target.value }))}
          />
          <input
            placeholder="Project title"
            value={projectForm.title}
            onChange={(event) => setProjectForm((prev) => ({ ...prev, title: event.target.value }))}
          />
          <input
            placeholder="Description"
            value={projectForm.description}
            onChange={(event) => setProjectForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <input
            placeholder="Support needed"
            value={projectForm.support_needed}
            onChange={(event) => setProjectForm((prev) => ({ ...prev, support_needed: event.target.value }))}
          />
          <button type="submit" disabled={!selectedTeamId}>
            Add Team Project
          </button>
        </form>

        <form className="card" onSubmit={handleAddUpdate}>
          <h3>Add Team Project Update</h3>
          <input
            placeholder="Your user ID"
            value={updateForm.user_id}
            onChange={(event) => setUpdateForm((prev) => ({ ...prev, user_id: event.target.value }))}
          />
          <select
            value={updateForm.project_id}
            onChange={(event) => setUpdateForm((prev) => ({ ...prev, project_id: event.target.value }))}
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
          <input
            placeholder="Milestone"
            value={updateForm.milestone}
            onChange={(event) => setUpdateForm((prev) => ({ ...prev, milestone: event.target.value }))}
          />
          <button type="submit" disabled={!selectedTeamId || !updateForm.project_id}>
            Post Update
          </button>
        </form>
      </div>

      <article className="card">
        <h3>Team Activity</h3>
        <ul>
          {activity.map((event) => (
            <li key={event.id}>
              [{event.activity_type}] {event.detail}
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
