const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('dcc_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'API request failed');
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { email?: string; password?: string }) =>
    fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload: { name: string; email: string; password: string; rollNumber: string; position?: string; teamId?: string }) =>
    fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => fetchApi('/auth/me'),
  updateProfile: (payload: { position?: string; name?: string }) =>
    fetchApi('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),

  // Teams
  getTeams: () => fetchApi('/teams'),
  createTeam: (teamData: any) =>
    fetchApi('/teams', { method: 'POST', body: JSON.stringify(teamData) }),

  // Sessions
  getSessions: () => fetchApi('/sessions'),
  getSession: (id: string) => fetchApi(`/sessions/${id}`),
  createSession: (sessionData: any) =>
    fetchApi('/sessions', { method: 'POST', body: JSON.stringify(sessionData) }),
  getSessionQr: (id: string) => fetchApi(`/sessions/${id}/qr`),

  // Attendance & Scanning
  scanQrPayload: (payload: { qrCodeToken?: string; memberRollNumber?: string; sessionId?: string }) =>
    fetchApi('/attendance/scan', { method: 'POST', body: JSON.stringify(payload) }),
  manualOverride: (payload: { sessionId: string; userId: string; action: 'mark_present' | 'mark_absent' }) =>
    fetchApi('/attendance/manual', { method: 'POST', body: JSON.stringify(payload) }),
  getMyStats: () => fetchApi('/attendance/my-stats'),
  getAdminAnalytics: () => fetchApi('/attendance/analytics'),

  // Users
  getUsers: () => fetchApi('/users'),
  updateUserRole: (id: string, payload: { role?: string; position?: string; teamId?: string | null }) =>
    fetchApi(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify(payload) }),
};
