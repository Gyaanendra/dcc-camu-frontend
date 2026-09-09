// API Service Client for Club DCC Camu Backend
// All calls go to same-origin `/api/*` and are proxied to the backend by the
// Next.js rewrite in next.config.mjs. This makes every request first-party:
// no CORS preflights, no third-party cookie blocking between Vercel apps.
const API_BASE = '/api';

const TOKEN_STORAGE_KEY = 'dcc_token';

class ApiClient {
  // Bearer token persisted in localStorage so sessions survive page reloads
  // even when the browser blocks the cross-site httpOnly cookie. The cookie
  // (sent via `credentials: include`) remains a parallel credential.
  private token: string | null = null;
  private hydrated = false;

  constructor() {}

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      try {
        if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
        else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch {
        // Storage unavailable (private mode / quota): in-memory token only.
      }
    }
  }

  getToken(): string | null {
    // Lazily hydrate from localStorage on first access (client-side only —
    // this module also executes during SSR/prerender, where storage is absent).
    if (!this.hydrated) {
      this.hydrated = true;
      if (typeof window !== 'undefined') {
        try {
          this.token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
        } catch {
          // Storage unavailable: keep in-memory token only.
        }
      }
    }
    return this.token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error(`[API Error] ${options.method || 'GET'} ${url}:`, error.message);
      throw error;
    }
  }

  // Auth Endpoints
  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: normalizedEmail, password }),
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    rollNumber: string;
    position?: string;
    teamId?: string;
  }) {
    const normalizedUserData = {
      ...userData,
      email: userData.email.trim().toLowerCase(),
    };
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(normalizedUserData),
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async updateProfile(profileData: { position?: string; name?: string }) {
    // Disabled: backend returns 403 — self-editing is turned off. Kept for backwards compat.
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Attendance Endpoints
  async scanQrPayload(payload: {
    qrCodeToken?: string;
    memberRollNumber?: string;
    sessionId?: string;
  }) {
    return this.request('/attendance/scan', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMyStats() {
    return this.request('/attendance/my-stats');
  }

  // Admin: Manually mark a member present/absent for a session
  async manualAttendance(payload: { sessionId: string; userId: string; action: 'mark_present' | 'mark_absent' }) {
    return this.request('/attendance/manual', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAdminAnalytics() {
    return this.request('/attendance/admin-analytics');
  }

  // Admin: Full attendance matrix (members × sessions)
  async getAttendanceSheet() {
    return this.request('/attendance/sheet');
  }

  // Sessions Endpoints
  async getSessions() {
    return this.request('/sessions');
  }

  async getSession(id: string) {
    return this.request(`/sessions/${id}`);
  }

  async createSession(sessionData: {
    title: string;
    type?: string;
    description?: string;
    teamId?: string | null;
    location?: string;
    durationMinutes?: string;
  }) {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  // Close or Re-activate Live Session QR
  async updateSessionStatus(sessionId: string, status: { isActive: boolean | string }) {
    return this.request(`/sessions/${sessionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(status),
    });
  }

  // Teams & Users
  async getTeams() {
    return this.request('/teams');
  }

  async createTeam(teamData: { name: string; code: string; description?: string; color?: string }) {
    return this.request('/teams', {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  }

  async updateTeam(teamId: string, teamData: { name?: string; code?: string; description?: string; color?: string }) {
    return this.request(`/teams/${teamId}`, {
      method: 'PATCH',
      body: JSON.stringify(teamData),
    });
  }

  async deleteTeam(teamId: string) {
    return this.request(`/teams/${teamId}`, {
      method: 'DELETE',
    });
  }

  async getUsers() {
    return this.request('/users');
  }

  // Admin: Create a new member directly
  async createMember(memberData: {
    name: string;
    email: string;
    password: string;
    rollNumber: string;
    position?: string;
    teamId?: string | null;
    role?: string;
  }) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  }

  async updateUser(userId: string, userData: { role?: string; position?: string; teamId?: string | null; name?: string; email?: string; rollNumber?: string; password?: string }) {
    return this.request(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  async updateUserRole(userId: string, roleData: { role: string; position?: string; teamId?: string | null; name?: string }) {
    return this.request(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify(roleData),
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
