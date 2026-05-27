// lib/api.js — helper to call the Express backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function apiFetch(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  getCompany:     (token)             => apiFetch('/api/company', {}, token),
  createCompany:  (token, body)       => apiFetch('/api/company', { method: 'POST', body: JSON.stringify(body) }, token),
  updateCompany:  (token, body)       => apiFetch('/api/company', { method: 'PUT',  body: JSON.stringify(body) }, token),
  getAccounts:    (token)             => apiFetch('/api/accounts', {}, token),
  getCampaigns:   (token, platform, period) => apiFetch(`/api/campaigns?platform=${platform}&period=${period}`, {}, token),
  getReports:     (token, platform)   => apiFetch(`/api/reports?platform=${platform}`, {}, token),
  getStatus:      (token)             => apiFetch('/api/connection-status', {}, token),
};
