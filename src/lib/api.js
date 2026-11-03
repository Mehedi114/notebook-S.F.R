const MEMBER_IDENTITY_KEY = 'sfr_member_identity_v1';
const THEME_KEY = 'sfr_theme_v2';

const memoryStore = new Map();

function readKey(key) {
  if (memoryStore.has(key)) {
    return memoryStore.get(key);
  }
  try {
    const val = window.localStorage.getItem(key);
    if (val !== null) {
      memoryStore.set(key, val);
      return val;
    }
  } catch {
    // ignore iframe storage block
  }
  try {
    const sVal = window.sessionStorage.getItem(key);
    if (sVal !== null) {
      memoryStore.set(key, sVal);
      return sVal;
    }
  } catch {
    // ignore
  }
  return '';
}

function writeKey(key, value) {
  if (value) memoryStore.set(key, value);
  else memoryStore.delete(key);

  try {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
  try {
    if (value) window.sessionStorage.setItem(key, value);
    else window.sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function getStoredMemberIdentity() {
  try {
    const raw = readKey(MEMBER_IDENTITY_KEY);
    if (!raw) return { name: '', role: 'Team Member', onboarded: false };
    const parsed = JSON.parse(raw);
    const cleanName = (parsed.name || '').trim();
    return {
      name: cleanName,
      role: parsed.role || 'Team Member',
      onboarded: Boolean(cleanName),
    };
  } catch {
    return { name: '', role: 'Team Member', onboarded: false };
  }
}

export function setStoredMemberIdentity(identity) {
  const clean = {
    name: String(identity?.name || '').trim(),
    role: identity?.role || 'Team Member',
    onboarded: Boolean(String(identity?.name || '').trim()),
  };
  writeKey(MEMBER_IDENTITY_KEY, JSON.stringify(clean));
  return clean;
}

export function getStoredTheme() {
  return readKey(THEME_KEY) || 'dark';
}

export function setStoredTheme(theme) {
  writeKey(THEME_KEY, theme || 'dark');
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  getStudio: () => request('/api/studio'),
  updateStudio: (payload) =>
    request('/api/studio', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getFolders: () => request('/api/folders'),
  getScripts: () => request('/api/scripts'),
  getScript: (id) => request(`/api/scripts/${id}`),
  getScriptBySlug: (slug) => request(`/api/scripts/by-slug/${encodeURIComponent(slug)}`),
  createScript: (payload) =>
    request('/api/scripts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateScript: (id, payload) =>
    request(`/api/scripts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  duplicateScript: (id, authorName) =>
    request(`/api/scripts/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ authorName }),
    }),
  deleteScript: (id) =>
    request(`/api/scripts/${id}`, {
      method: 'DELETE',
    }),

  addComment: (scriptId, payload) =>
    request(`/api/scripts/${scriptId}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  toggleResolveComment: (commentId, isResolved) =>
    request(`/api/comments/${commentId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ isResolved }),
    }),
  deleteComment: (commentId) =>
    request(`/api/comments/${commentId}`, {
      method: 'DELETE',
    }),
};
