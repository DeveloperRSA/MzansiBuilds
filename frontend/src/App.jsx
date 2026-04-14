import React, { useEffect, useMemo, useState } from 'react';

const USERS_KEY = 'mb_users';
const PROJECTS_KEY = 'mb_projects';
const SESSION_KEY = 'mb_session';

const AUTH_INITIAL = {
  loginEmail: '',
  loginPassword: '',
  regName: '',
  regEmail: '',
  regPassword: '',
  regBio: '',
  regSkills: '',
};

const PROJECT_FORM_INITIAL = {
  title: '',
  description: '',
  tech: '',
  stage: 'Idea',
};

const STAGE_OPTIONS = ['Idea', 'Planning', 'In Progress', 'Testing', 'Completed'];

const STAGE_BADGE_CLASSES = {
  Idea: 'border-cyan-400/40 text-cyan-300',
  Planning: 'border-blue-400/40 text-blue-300',
  'In Progress': 'border-amber-400/40 text-amber-300',
  Testing: 'border-violet-400/40 text-violet-300',
  Completed: 'border-[#00FF41]/40 text-[#00FF41]',
};

function makeId() {
  return `id_${Math.random().toString(36).slice(2)}`;
}

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [session, setSession] = useState(null);
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  const [auth, setAuth] = useState(AUTH_INITIAL);
  const [screen, setScreen] = useState('feed');
  const [showRegister, setShowRegister] = useState(false);
  const [errors, setErrors] = useState({ login: '', register: '', project: '', milestone: '' });

  const [toast, setToast] = useState('');
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState(PROJECT_FORM_INITIAL);
  const [milestoneModal, setMilestoneModal] = useState({ open: false, projectId: '', text: '' });
  const [commentDraft, setCommentDraft] = useState({});

  useEffect(() => {
    const bootUsers = safeParse(localStorage.getItem(USERS_KEY), []);
    const bootProjects = safeParse(localStorage.getItem(PROJECTS_KEY), []);
    const bootSession = safeParse(localStorage.getItem(SESSION_KEY), null);

    setUsers(Array.isArray(bootUsers) ? bootUsers : []);
    setProjects(Array.isArray(bootProjects) ? bootProjects : []);
    setSession(bootSession && typeof bootSession === 'object' ? bootSession : null);
    setIsBootstrapped(true);
  }, []);

  useEffect(() => {
    if (!isBootstrapped) return;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users, isBootstrapped]);

  useEffect(() => {
    if (!isBootstrapped) return;
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }, [projects, isBootstrapped]);

  useEffect(() => {
    if (!isBootstrapped) return;
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [session, isBootstrapped]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const currentUser = useMemo(() => users.find((u) => u.id === session?.id) || null, [users, session]);
  const completedProjects = useMemo(() => projects.filter((p) => p.stage === 'Completed' || p.completed), [projects]);
  const activeProjects = useMemo(() => projects.filter((p) => !(p.stage === 'Completed' || p.completed)), [projects]);
  const myProjects = useMemo(() => projects.filter((p) => p.authorId === currentUser?.id), [projects, currentUser]);
  const trending = useMemo(() => [...projects].sort((a, b) => b.hands.length - a.hands.length).slice(0, 4), [projects]);

  function showScreen(screenId) {
    const supported = ['feed', 'my-projects', 'profile'];
    setScreen(supported.includes(screenId) ? screenId : 'feed');
  }

  function register(name, email, password, bio, skills) {
    if (!name || !email || !password) {
      setErrors((prev) => ({ ...prev, register: 'Please complete name, email and password.' }));
      return false;
    }

    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      setErrors((prev) => ({ ...prev, register: 'A user with this email already exists.' }));
      return false;
    }

    const nextUser = {
      id: makeId(),
      name,
      email,
      password,
      bio,
      skills,
    };

    setUsers((prev) => [...prev, nextUser]);
    setSession({ id: nextUser.id });
    setShowRegister(false);
    setErrors((prev) => ({ ...prev, register: '' }));
    setAuth(AUTH_INITIAL);
    showScreen('feed');
    setToast(`Welcome, ${nextUser.name}!`);
    return true;
  }

  function login(email, password) {
    if (!email || !password) {
      setErrors((prev) => ({ ...prev, login: 'Email and password are required.' }));
      return false;
    }

    const match = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!match) {
      setErrors((prev) => ({ ...prev, login: 'Invalid credentials.' }));
      return false;
    }

    setSession({ id: match.id });
    setErrors((prev) => ({ ...prev, login: '' }));
    showScreen('feed');
    setToast(`Welcome back, ${match.name}`);
    return true;
  }

  function logout() {
    setSession(null);
    setShowRegister(false);
    setAuth(AUTH_INITIAL);
    setErrors({ login: '', register: '', project: '', milestone: '' });
    showScreen('feed');
  }

  function addProject(title, description, tech, stage) {
    if (!currentUser) return;
    if (!title || !description) {
      setErrors((prev) => ({ ...prev, project: 'Title and description are required.' }));
      return;
    }

    const project = {
      id: makeId(),
      authorId: currentUser.id,
      title,
      description,
      tech,
      stage,
      milestones: [],
      hands: [],
      comments: [],
      completed: stage === 'Completed',
      ts: new Date().toISOString(),
    };

    setProjects((prev) => [project, ...prev]);
    setProjectForm(PROJECT_FORM_INITIAL);
    setProjectModalOpen(false);
    setErrors((prev) => ({ ...prev, project: '' }));
    setToast('Project added to live feed.');
  }

  function addMilestone(projectId, text) {
    if (!text.trim()) {
      setErrors((prev) => ({ ...prev, milestone: 'Milestone text is required.' }));
      return;
    }

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, milestones: [...p.milestones, { id: makeId(), text: text.trim(), date: new Date().toISOString() }] }
          : p,
      ),
    );

    setMilestoneModal({ open: false, projectId: '', text: '' });
    setErrors((prev) => ({ ...prev, milestone: '' }));
    setToast('Milestone saved.');
  }

  function toggleHand(projectId) {
    if (!currentUser) return;

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const hasRaised = p.hands.includes(currentUser.id);
        return {
          ...p,
          hands: hasRaised ? p.hands.filter((id) => id !== currentUser.id) : [...p.hands, currentUser.id],
        };
      }),
    );

    setToast('Collaboration preference updated.');
  }

  function addComment(projectId, text) {
    if (!currentUser || !text.trim()) return;

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              comments: [...p.comments, { id: makeId(), userId: currentUser.id, text: text.trim(), ts: new Date().toISOString() }],
            }
          : p,
      ),
    );

    setCommentDraft((prev) => ({ ...prev, [projectId]: '' }));
  }

  function renderFeed() {
    if (!currentUser) return null;

    return (
      <>
        <section>
          <h2 className="text-2xl font-bold mb-3 text-white">Live Feed</h2>
          <div className="space-y-4">
            {activeProjects.length === 0 ? (
              <p className="text-zinc-400">No active projects yet.</p>
            ) : (
              activeProjects.map((project) => {
                const owner = users.find((u) => u.id === project.authorId);
                const handRaised = project.hands.includes(currentUser.id);
                const stageClass = STAGE_BADGE_CLASSES[project.stage] || STAGE_BADGE_CLASSES.Idea;

                return (
                  <article key={project.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{project.title}</h3>
                        <p className="text-sm text-zinc-400">
                          by {owner?.name || 'Unknown'} · {new Date(project.ts).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs border px-2 py-1 rounded-full ${stageClass}`}>{project.stage}</span>
                    </div>

                    <p className="text-zinc-300 mt-2">{project.description}</p>
                    {project.tech && <p className="text-xs text-zinc-400 mt-2">Tech: {project.tech}</p>}

                    <div className="mt-3">
                      <p className="text-xs uppercase text-zinc-500 mb-1">Milestones</p>
                      {project.milestones.length === 0 ? (
                        <p className="text-sm text-zinc-500">No milestones yet.</p>
                      ) : (
                        <ul className="list-disc ml-5 text-sm text-zinc-300 space-y-1">
                          {project.milestones.map((m) => (
                            <li key={m.id}>{m.text}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        className={`px-3 py-1 rounded-lg text-sm border ${
                          handRaised ? 'border-[#00FF41] text-[#00FF41]' : 'border-zinc-700 text-zinc-300'
                        }`}
                        onClick={() => toggleHand(project.id)}
                      >
                        🤝 {handRaised ? 'Hand raised' : 'Raise hand'} ({project.hands.length})
                      </button>

                      {project.authorId === currentUser.id && (
                        <button
                          className="px-3 py-1 rounded-lg text-sm border border-zinc-700 text-zinc-300"
                          onClick={() => setMilestoneModal({ open: true, projectId: project.id, text: '' })}
                        >
                          + Milestone
                        </button>
                      )}
                    </div>

                    <div className="mt-4 border-t border-zinc-800 pt-3">
                      <p className="text-xs uppercase text-zinc-500">Comments ({project.comments.length})</p>
                      <div className="space-y-1 mt-2">
                        {project.comments.map((c) => {
                          const commenter = users.find((u) => u.id === c.userId);
                          return (
                            <p key={c.id} className="text-sm text-zinc-300">
                              <span className="text-[#00FF41]">{commenter?.name || 'User'}:</span> {c.text}
                            </p>
                          );
                        })}
                      </div>

                      <div className="flex gap-2 mt-2">
                        <input
                          className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                          placeholder="Add a comment"
                          value={commentDraft[project.id] || ''}
                          onChange={(e) => setCommentDraft((prev) => ({ ...prev, [project.id]: e.target.value }))}
                        />
                        <button
                          className="bg-zinc-800 px-3 rounded-lg text-sm text-zinc-100"
                          onClick={() => addComment(project.id, commentDraft[project.id] || '')}
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-xl font-bold mb-2 text-white">🎉 Celebration Wall</h2>
          {completedProjects.length === 0 ? (
            <p className="text-zinc-400">No completed projects yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {completedProjects.map((project) => {
                const owner = users.find((u) => u.id === project.authorId);
                return (
                  <div key={project.id} className="border border-[#00FF41]/30 rounded-lg p-3">
                    <p className="font-semibold text-white">{project.title}</p>
                    <p className="text-sm text-zinc-400">by {owner?.name || 'Unknown'}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </>
    );
  }

  if (!isBootstrapped) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-sm text-zinc-400">Loading workspace…</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md border border-[#00FF41]/30 bg-zinc-950 rounded-2xl shadow-[0_0_30px_rgba(0,255,65,0.12)] p-7">
          <h1 className="text-3xl font-black text-center mb-1 text-white">
            Mzansi<span className="text-[#00FF41]">Builds</span>
          </h1>
          <p className="text-zinc-400 text-center mb-6">Developer Platform</p>

          {!showRegister ? (
            <>
              <input
                className="w-full mb-3 bg-black border border-zinc-700 rounded-lg px-3 py-2"
                placeholder="Email"
                value={auth.loginEmail}
                onChange={(e) => setAuth({ ...auth, loginEmail: e.target.value })}
              />
              <input
                className="w-full mb-3 bg-black border border-zinc-700 rounded-lg px-3 py-2"
                placeholder="Password"
                type="password"
                value={auth.loginPassword}
                onChange={(e) => setAuth({ ...auth, loginPassword: e.target.value })}
              />
              {errors.login && <p className="text-red-400 text-sm mb-3">{errors.login}</p>}
              <button
                className="w-full bg-[#00FF41] text-black font-semibold rounded-lg py-2"
                onClick={() => login(auth.loginEmail.trim(), auth.loginPassword.trim())}
              >
                Sign in
              </button>
              <button className="w-full text-zinc-300 mt-3 text-sm" onClick={() => setShowRegister(true)}>
                Create an account
              </button>
            </>
          ) : (
            <>
              <input
                className="w-full mb-3 bg-black border border-zinc-700 rounded-lg px-3 py-2"
                placeholder="Name"
                value={auth.regName}
                onChange={(e) => setAuth({ ...auth, regName: e.target.value })}
              />
              <input
                className="w-full mb-3 bg-black border border-zinc-700 rounded-lg px-3 py-2"
                placeholder="Email"
                value={auth.regEmail}
                onChange={(e) => setAuth({ ...auth, regEmail: e.target.value })}
              />
              <input
                className="w-full mb-3 bg-black border border-zinc-700 rounded-lg px-3 py-2"
                placeholder="Password"
                type="password"
                value={auth.regPassword}
                onChange={(e) => setAuth({ ...auth, regPassword: e.target.value })}
              />
              <input
                className="w-full mb-3 bg-black border border-zinc-700 rounded-lg px-3 py-2"
                placeholder="Bio"
                value={auth.regBio}
                onChange={(e) => setAuth({ ...auth, regBio: e.target.value })}
              />
              <input
                className="w-full mb-3 bg-black border border-zinc-700 rounded-lg px-3 py-2"
                placeholder="Skills (comma-separated)"
                value={auth.regSkills}
                onChange={(e) => setAuth({ ...auth, regSkills: e.target.value })}
              />
              {errors.register && <p className="text-red-400 text-sm mb-3">{errors.register}</p>}
              <button
                className="w-full bg-[#00FF41] text-black font-semibold rounded-lg py-2"
                onClick={() =>
                  register(
                    auth.regName.trim(),
                    auth.regEmail.trim(),
                    auth.regPassword.trim(),
                    auth.regBio.trim(),
                    auth.regSkills.trim(),
                  )
                }
              >
                Register
              </button>
              <button className="w-full text-zinc-300 mt-3 text-sm" onClick={() => setShowRegister(false)}>
                Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="h-16 border-b border-[#00FF41]/20 px-6 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur z-40">
        <h1 className="text-2xl font-black text-white">
          Mzansi<span className="text-[#00FF41]">Builds</span>
        </h1>
        <button
          className="bg-[#00FF41] text-black px-4 py-2 rounded-lg font-semibold"
          onClick={() => setProjectModalOpen(true)}
        >
          + New Project
        </button>
      </header>

      <div className="grid grid-cols-12 gap-5 p-5 max-w-[1500px] mx-auto">
        <aside className="col-span-12 lg:col-span-2 bg-zinc-950 border border-zinc-800 rounded-xl p-4 h-fit">
          <p className="text-xs text-zinc-500 mb-3 uppercase">Navigation</p>
          <div className="space-y-2 text-sm">
            <button
              className={`w-full text-left px-3 py-2 rounded-lg ${screen === 'feed' ? 'bg-[#00FF41] text-black' : 'bg-zinc-900 text-zinc-100'}`}
              onClick={() => showScreen('feed')}
            >
              📰 Feed
            </button>
            <button
              className={`w-full text-left px-3 py-2 rounded-lg ${screen === 'my-projects' ? 'bg-[#00FF41] text-black' : 'bg-zinc-900 text-zinc-100'}`}
              onClick={() => showScreen('my-projects')}
            >
              🧱 My Projects
            </button>
            <button
              className={`w-full text-left px-3 py-2 rounded-lg ${screen === 'profile' ? 'bg-[#00FF41] text-black' : 'bg-zinc-900 text-zinc-100'}`}
              onClick={() => showScreen('profile')}
            >
              👤 Profile
            </button>
            <button className="w-full text-left px-3 py-2 rounded-lg bg-zinc-900 text-zinc-100" onClick={logout}>
              ↩ Logout
            </button>
          </div>
        </aside>

        <main className="col-span-12 lg:col-span-7 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 scrollbar-dark">
          {screen === 'feed' && renderFeed()}

          {screen === 'my-projects' && (
            <section>
              <h2 className="text-2xl font-bold mb-3 text-white">My Projects</h2>
              <div className="space-y-3">
                {myProjects.length === 0 ? (
                  <p className="text-zinc-400">You have not created projects yet.</p>
                ) : (
                  myProjects.map((project) => (
                    <div key={project.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-white">{project.title}</p>
                        <span className="text-xs text-[#00FF41]">{project.stage}</span>
                      </div>
                      <p className="text-sm text-zinc-400">{project.description}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {screen === 'profile' && (
            <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
              <h2 className="text-2xl font-bold mb-4 text-white">Profile</h2>
              <p>
                <span className="text-zinc-500">Name:</span> {currentUser.name}
              </p>
              <p>
                <span className="text-zinc-500">Email:</span> {currentUser.email}
              </p>
              <p>
                <span className="text-zinc-500">Bio:</span> {currentUser.bio || 'Not set'}
              </p>
              <p>
                <span className="text-zinc-500">Skills:</span> {currentUser.skills || 'Not set'}
              </p>
            </section>
          )}
        </main>

        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <h3 className="font-semibold mb-2 text-white">Platform Stats</h3>
            <div className="space-y-1 text-sm text-zinc-300">
              <p>
                Total Projects: <span className="text-[#00FF41]">{projects.length}</span>
              </p>
              <p>
                Active Builders: <span className="text-[#00FF41]">{new Set(activeProjects.map((p) => p.authorId)).size}</span>
              </p>
              <p>
                Shipped: <span className="text-[#00FF41]">{completedProjects.length}</span>
              </p>
            </div>
          </section>

          <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <h3 className="font-semibold mb-2 text-white">Trending Projects</h3>
            <div className="space-y-2">
              {trending.length === 0 ? (
                <p className="text-sm text-zinc-400">No projects yet.</p>
              ) : (
                trending.map((project) => (
                  <div key={project.id} className="text-sm border border-zinc-800 rounded-lg p-2">
                    <p className="font-medium text-white">{project.title}</p>
                    <p className="text-zinc-500">{project.hands.length} hands raised</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>

      {projectModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-[#00FF41]/30 w-full max-w-xl rounded-2xl p-5">
            <h3 className="text-xl font-bold mb-4 text-white">Add Project</h3>
            <input
              className="w-full mb-3 bg-black border border-zinc-700 rounded-lg px-3 py-2"
              placeholder="Title"
              value={projectForm.title}
              onChange={(e) => setProjectForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <textarea
              className="w-full mb-3 bg-black border border-zinc-700 rounded-lg px-3 py-2"
              placeholder="Description"
              value={projectForm.description}
              onChange={(e) => setProjectForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <input
              className="w-full mb-3 bg-black border border-zinc-700 rounded-lg px-3 py-2"
              placeholder="Tech stack"
              value={projectForm.tech}
              onChange={(e) => setProjectForm((prev) => ({ ...prev, tech: e.target.value }))}
            />
            <select
              className="w-full mb-3 bg-black border border-zinc-700 rounded-lg px-3 py-2"
              value={projectForm.stage}
              onChange={(e) => setProjectForm((prev) => ({ ...prev, stage: e.target.value }))}
            >
              {STAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {errors.project && <p className="text-red-400 text-sm mb-2">{errors.project}</p>}

            <div className="flex gap-2">
              <button
                className="flex-1 bg-[#00FF41] text-black py-2 rounded-lg font-semibold"
                onClick={() =>
                  addProject(
                    projectForm.title.trim(),
                    projectForm.description.trim(),
                    projectForm.tech.trim(),
                    projectForm.stage,
                  )
                }
              >
                Create
              </button>
              <button className="flex-1 bg-zinc-800 py-2 rounded-lg text-zinc-100" onClick={() => setProjectModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {milestoneModal.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-[#00FF41]/30 w-full max-w-md rounded-2xl p-5">
            <h3 className="text-xl font-bold mb-3 text-white">Add Milestone</h3>
            <input
              className="w-full mb-3 bg-black border border-zinc-700 rounded-lg px-3 py-2"
              placeholder="What did you ship?"
              value={milestoneModal.text}
              onChange={(e) => setMilestoneModal((prev) => ({ ...prev, text: e.target.value }))}
            />
            {errors.milestone && <p className="text-red-400 text-sm mb-2">{errors.milestone}</p>}

            <div className="flex gap-2">
              <button
                className="flex-1 bg-[#00FF41] text-black py-2 rounded-lg font-semibold"
                onClick={() => addMilestone(milestoneModal.projectId, milestoneModal.text)}
              >
                Save
              </button>
              <button
                className="flex-1 bg-zinc-800 py-2 rounded-lg text-zinc-100"
                onClick={() => setMilestoneModal({ open: false, projectId: '', text: '' })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-zinc-900 border border-[#00FF41]/50 rounded-lg px-4 py-2 text-sm text-zinc-100">
          {toast}
        </div>
      )}
    </div>
  );
}
