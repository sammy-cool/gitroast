/**
 * EDU: The recruiterService handles all API calls related to recruiter functionality.
 * It ensures that the 'gitroast_recruiter_token' is passed in the Authorization header
 * for authenticated requests.
 */

const getAuthHeaders = () => {
  // EDU: Retrieve the token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('gitroast_recruiter_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const getDashboardStats = async () => {
  // EDU: Fetch high-level statistics for the recruiter dashboard
  const response = await fetch('/api/recruiter/stats', {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
};

export const getSavedCandidates = async () => {
  const response = await fetch('/api/recruiter/saved', {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch saved candidates');
  return response.json();
};

export const saveCandidate = async (username) => {
  const response = await fetch(`/api/recruiter/saved`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ username }),
  });
  if (!response.ok) throw new Error('Failed to save candidate');
  return response.json();
};

export const removeCandidate = async (username) => {
  const response = await fetch(`/api/recruiter/saved/${username}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to remove candidate');
  return response.json();
};

export const analyzeCandidate = async (username) => {
  const response = await fetch(`/api/recruiter/analyze/${username}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to analyze candidate');
  return response.json();
};
