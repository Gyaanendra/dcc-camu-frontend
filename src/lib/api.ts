// API Service Client for Club DCC Camu Backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('dcc_auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('dcc_auth_token', token);
      } else {
        localStorage.removeItem('dcc_auth_token');
      }
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('dcc_auth_token');
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
    const start = performance.now();
    console.log(`📡 [API Request] ${options.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const duration = Math.round(performance.now() - start);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.warn(`⚠️ [API Error] ${options.method || 'GET'} ${url} -> ${response.status} (${duration}ms):`, data.error || data.message);
        throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
      }

      console.log(`✅ [API Response] ${options.method || 'GET'} ${url} -> ${response.status} (${duration}ms)`);
      return data;
    } catch (error: any) {
      console.error(`❌ [Network/API Error] ${options.method || 'GET'} ${url}:`, error.message);
      throw error;
    }
  }

  // Auth Endpoints
  async login(email: string, password: string) {
    console.log(`🔑 [Auth] Attempting login for Bennett email: ${email}`);
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
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
    console.log(`📝 [Auth] Registering member: ${userData.name} (${userData.rollNumber})`);
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(profileData: { position?: string; name?: string }) {
    console.log(`✏️ [Profile] Updating profile info:`, profileData);
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
    console.log(`📷 [QR Scan] Processing attendance payload:`, payload);
    return this.request('/attendance/scan', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMyStats() {
    return this.request('/attendance/my-stats');
  }

  async getAdminAnalytics() {
    return this.request('/attendance/admin-analytics');
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
    console.log(`📅 [Sessions] Creating new event: ${sessionData.title}`);
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  // Close or Re-activate Live Session QR
  async updateSessionStatus(sessionId: string, status: { isActive: boolean | string }) {
    console.log(`⏹️ [Sessions] Updating live session ${sessionId} status:`, status);
    return this.request(`/sessions/${sessionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(status),
    });
  }

  // Teams & Users
  async getTeams() {
    return this.request('/teams');
  }

  async getUsers() {
    return this.request('/users');
  }

  async updateUserRole(userId: string, roleData: { role: string; position?: string; teamId?: string | null }) {
    console.log(`🛡️ [Admin] Updating role/team for user ${userId}:`, roleData);
    return this.request(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify(roleData),
    });
  }
}

export const api = new ApiClient();
