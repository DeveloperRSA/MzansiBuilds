import React, { useEffect, useState } from 'react';
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

const TEAM_TYPES = ["hackathon", "student_group", "startup", "general"];

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

  // Logic remains identical to your working version
  async function loadTeams() {
    try {
      const data = await listTeams();
      setTeams(data);
      if (!selectedTeamId && data.length) setSelectedTeamId(String(data[0].id));
    } catch (loadError) { setError(loadError.message); }
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
    } catch (loadError) { setError(loadError.message); }
  }

  useEffect(() => { loadTeams(); }, []);
  useEffect(() => { if (selectedTeamId) loadTeamDetails(selectedTeamId); }, [selectedTeamId]);

  async function handleCreateTeam(e) {
    e.preventDefault();
    try {
      await createTeam({ ...teamForm, owner_id: Number(teamForm.owner_id) });
      setTeamForm({ owner_id: "", name: "", description: "", team_type: "general" });
      await loadTeams();
    } catch (err) { setError(err.message); }
  }

  async function handleJoinTeam(e) {
    e.preventDefault();
    try {
      await joinTeam(selectedTeamId, { ...joinForm, user_id: Number(joinForm.user_id) });
      setJoinForm({ user_id: "", role: "member" });
      await loadTeamDetails(selectedTeamId);
    } catch (err) { setError(err.message); }
  }

  async function handleCreateProject(e) {
    e.preventDefault();
    try {
      await createTeamProject(selectedTeamId, { ...projectForm, user_id: Number(projectForm.user_id) });
      setProjectForm({ user_id: "", title: "", description: "", stage: "building", support_needed: "collaborators" });
      await loadTeamDetails(selectedTeamId);
    } catch (err) { setError(err.message); }
  }

  return (
    <section className="w-full max-w-6xl mx-auto py-16 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-2">Team <span className="text-mzansi">Collaboration</span></h2>
        <p className="text-gray-500">Hackathons, startups, and student groups building together.</p>
        {error && <p className="mt-4 text-red-500 bg-red-500/10 py-2 px-4 rounded-lg inline-block">{error}</p>}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Team Management */}
        <div className="lg:col-span-1 space-y-6">
          {/* Create Team Form */}
          <form onSubmit={handleCreateTeam} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 shadow-xl">
            <h3 className="text-mzansi font-bold mb-4 flex items-center gap-2"><span>⊕</span> Create Team</h3>
            <div className="space-y-3">
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm focus:border-mzansi/50 outline-none transition-all"
                placeholder="Owner User ID" value={teamForm.owner_id}
                onChange={(e) => setTeamForm(p => ({ ...p, owner_id: e.target.value }))}
              />
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm focus:border-mzansi/50 outline-none transition-all"
                placeholder="Team Name" value={teamForm.name}
                onChange={(e) => setTeamForm(p => ({ ...p, name: e.target.value }))}
              />
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-gray-400 outline-none"
                value={teamForm.team_type} onChange={(e) => setTeamForm(p => ({ ...p, team_type: e.target.value }))}
              >
                {TEAM_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
              <button type="submit" className="w-full bg-mzansi text-black font-bold py-2.5 rounded-xl hover:shadow-[0_0_15px_rgba(0,223,130,0.3)] transition-all">
                Create Team
              </button>
            </div>
          </form>

          {/* Selector & Join Form */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4">Active Teams</h3>
            <select 
              className="w-full bg-white/10 border border-white/10 rounded-xl py-2.5 px-4 text-sm mb-6 outline-none text-mzansi"
              value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)}
            >
              <option value="">Select a team</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            <form onSubmit={handleJoinTeam} className="pt-4 border-t border-white/5 space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Join Selected</h4>
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm outline-none"
                placeholder="Your User ID" value={joinForm.user_id}
                onChange={(e) => setJoinForm(p => ({ ...p, user_id: e.target.value }))}
              />
              <button type="submit" disabled={!selectedTeamId} className="w-full border border-mzansi/30 text-mzansi py-2.5 rounded-xl text-sm font-bold hover:bg-mzansi/10 disabled:opacity-30 transition-all">
                Join Team
              </button>
            </form>
          </div>
        </div>

        {/* Middle Column: Projects & Updates */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Create Project */}
            <form onSubmit={handleCreateProject} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4">New Team Project</h3>
              <div className="space-y-3">
                <input className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm outline-none" placeholder="Project Title" value={projectForm.title} onChange={(e) => setProjectForm(p => ({ ...p, title: e.target.value }))} />
                <textarea className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm outline-none h-20" placeholder="Description" value={projectForm.description} onChange={(e) => setProjectForm(p => ({ ...p, description: e.target.value }))} />
                <button type="submit" disabled={!selectedTeamId} className="w-full bg-mzansi text-black font-bold py-2.5 rounded-xl disabled:opacity-30">Add Project</button>
              </div>
            </form>

            {/* Members List */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-widest text-gray-500">Members</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {members.map(m => (
                  <div key={m.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-sm font-medium">@{m.user.username}</span>
                    <span className="text-[10px] bg-mzansi/10 text-mzansi px-2 py-0.5 rounded border border-mzansi/20 uppercase font-mono">{m.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Team Activity Feed */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-mzansi animate-pulse"></span>
               Recent Activity
            </h3>
            <div className="space-y-4">
              {activity.length > 0 ? activity.map(event => (
                <div key={event.id} className="flex gap-4 items-start border-l-2 border-mzansi/20 pl-4 py-1">
                  <div className="min-w-[80px] text-[10px] font-mono text-mzansi uppercase tracking-tighter opacity-70 pt-1">
                    {event.activity_type}
                  </div>
                  <div className="text-sm text-gray-300">
                    {event.detail}
                  </div>
                </div>
              )) : <p className="text-gray-600 text-sm italic">No activity yet...</p>}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}