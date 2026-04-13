// Single place for API base URL so switching environments is easy.
const API_BASE = "https://miniature-goldfish-7jj59r5rw6rhrpxp-8000.app.github.dev";

// Tiny helper for JSON APIs: adds headers + unified error handling.
async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || "Request failed");
  }

  return response.json();
}

export async function getFeed() {
  return api("/feed");
}

export async function getCelebrationWall() {
  return api("/celebration");
}

export async function listTeams() {
  return api("/teams");
}

export async function createTeam(payload) {
  return api("/teams", { method: "POST", body: JSON.stringify(payload) });
}

export async function joinTeam(teamId, payload) {
  return api(`/teams/${teamId}/join`, { method: "POST", body: JSON.stringify(payload) });
}

export async function getTeamMembers(teamId) {
  return api(`/teams/${teamId}/members`);
}

export async function getTeamProjects(teamId) {
  return api(`/teams/${teamId}/projects`);
}

export async function createTeamProject(teamId, payload) {
  return api(`/teams/${teamId}/projects`, { method: "POST", body: JSON.stringify(payload) });
}

export async function addTeamProjectUpdate(teamId, projectId, payload) {
  return api(`/teams/${teamId}/projects/${projectId}/updates`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getTeamActivity(teamId) {
  return api(`/teams/${teamId}/activity`);
}
