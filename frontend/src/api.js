const API_BASE = "http://127.0.0.1:8000";

export async function getFeed() {
  const res = await fetch(`${API_BASE}/feed`);
  return res.json();
}

export async function getCelebrationWall() {
  const res = await fetch(`${API_BASE}/celebration`);
  return res.json();
}
