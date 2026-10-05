/**
 * REST API Client for Sakhi Backend (Express + SQLite)
 */

const API_BASE = 'http://localhost:3001/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('sakhi_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async sendOtp(phone: string) {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to send OTP');
    return res.json();
  },

  async verifyOtp(phone: string, otp: string) {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Invalid OTP');
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('sakhi_token', data.token);
    }
    return data;
  },

  async adminLogin(adminId: string, pin: string) {
    const res = await fetch(`${API_BASE}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, pin }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Invalid credentials');
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('sakhi_token', data.token);
    }
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) return null;
    return res.json();
  },

  // Patients
  async getPatients(params?: { search?: string; district?: string }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`${API_BASE}/patients?${query}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch patients');
    return res.json();
  },

  async getPatient(id: string) {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Patient not found');
    return res.json();
  },

  async createPatient(data: {
    name: string;
    age: number;
    sex: 'male' | 'female' | 'other';
    occupation: string;
    village: string;
    block: string;
    district?: string;
    contact?: string;
    bmiCategory?: string;
    priorInjury?: boolean;
    familyHistory?: boolean;
  }) {
    const res = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to create patient');
    return res.json();
  },

  async updatePatientConsent(id: string, consent_given: boolean) {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ consent_given }),
    });
    if (!res.ok) throw new Error('Failed to update consent');
    return res.json();
  },

  // Screenings
  async createScreening(data: { patientId: string; campName?: string }) {
    const res = await fetch(`${API_BASE}/screenings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to create screening');
    return res.json();
  },

  async getScreening(id: string) {
    const res = await fetch(`${API_BASE}/screenings/${id}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Screening not found');
    return res.json();
  },

  async updateScreening(id: string, updates: Record<string, any>) {
    const res = await fetch(`${API_BASE}/screenings/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update screening');
    return res.json();
  },

  // X-Ray ML Plugin Slot
  async uploadXrayData(id: string, data: { klGrade?: number; xrayMlScore?: number; xrayImagePath?: string }) {
    const res = await fetch(`${API_BASE}/screenings/${id}/xray`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update X-Ray ML data');
    return res.json();
  },

  // Guidance
  async getGuidance(category?: string, search?: string) {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (search) params.append('search', search);
    const res = await fetch(`${API_BASE}/guidance?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch guidance');
    return res.json();
  },

  // Admin
  async getAdminStats() {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return res.json();
  },

  async getAdminClusters() {
    const res = await fetch(`${API_BASE}/admin/clusters`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch admin clusters');
    return res.json();
  },

  async getAdminPatients(params?: { risk?: string; block?: string; limit?: string; offset?: string }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`${API_BASE}/admin/patients?${query}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch admin patient list');
    return res.json();
  },
};
