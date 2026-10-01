'use client';

import React, { useState, useEffect } from 'react';
import { analyzeCandidate, saveCandidate } from '../../../../../services/recruiterService';
import toast from '../../../../../utils/toastUtils';

/**
 * EDU: The AnalyzeClient displays the Hireability Brief for a specific candidate.
 * It allows the recruiter to save the candidate and view their skills and red flags.
 */
export default function AnalyzeClient({ username }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // EDU: Fetch the analysis data when the component mounts or username changes
    const fetchAnalysis = async () => {
      try {
        const result = await analyzeCandidate(username);
        setData(result);
      } catch (error) {
        console.error('Analysis failed:', error);
        toast.error('Failed to load candidate analysis.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [username]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCandidate(username);
      toast.success('Candidate saved successfully!');
    } catch (error) {
      toast.error('Failed to save candidate.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: '#333', padding: '2rem' }}>Analyzing candidate {username}...</div>;
  if (!data) return <div style={{ color: '#ff5252', padding: '2rem' }}>No data found for {username}.</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: '#333', margin: 0 }}>Hireability Brief: {username}</h1>
        <button 
          onClick={handleSave} 
          disabled={saving}
          style={{ padding: '0.75rem 1.5rem', backgroundColor: '#00bcd4', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {saving ? 'Saving...' : 'Save Candidate'}
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card, #f8f9fa)', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', color: '#333' }}>
        <h2 style={{ color: '#00bcd4', marginBottom: '1rem' }}>Developer Level: {data.level || 'Unknown'}</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>Top Skills</h3>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#555' }}>
            {(data.skills || []).map((skill, index) => (
              <li key={index}>{skill}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 style={{ color: '#ff5252', marginBottom: '0.5rem' }}>Red Flags</h3>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#555' }}>
            {(data.redFlags || []).map((flag, index) => (
              <li key={index}>{flag}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
