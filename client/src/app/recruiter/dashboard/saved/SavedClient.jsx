'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSavedCandidates, removeCandidate } from '../../../../services/recruiterService';
import toast from '../../../../utils/toastUtils';

/**
 * EDU: The SavedClient component lists all the candidates saved by the recruiter.
 * It provides options to view their analysis or remove them from the saved list.
 */
export default function SavedClient() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCandidates = async () => {
    try {
      const data = await getSavedCandidates();
      setCandidates(data.candidates || []);
    } catch (error) {
      console.error('Failed to load saved candidates:', error);
      toast.error('Could not load saved candidates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // EDU: Initial load of saved candidates
    fetchCandidates();
  }, []);

  const handleRemove = async (username) => {
    try {
      await removeCandidate(username);
      toast.success(`${username} removed from saved list.`);
      // EDU: Refresh the list after successful removal
      fetchCandidates();
    } catch (error) {
      toast.error('Failed to remove candidate.');
    }
  };

  if (loading) return <div style={{ color: '#333' }}>Loading saved candidates...</div>;

  return (
    <div>
      <h1 style={{ color: '#333', marginBottom: '2rem' }}>Saved Candidates</h1>
      
      {candidates.length === 0 ? (
        <p style={{ color: '#666' }}>No candidates saved yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {candidates.map((candidate) => (
            <div key={candidate.username} style={{ backgroundColor: 'var(--bg-card, #f8f9fa)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ margin: 0, color: '#00bcd4' }}>{candidate.username}</h3>
              <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                <Link 
                  href={`/recruiter/dashboard/analyze/${candidate.username}`}
                  style={{ textDecoration: 'none', padding: '0.5rem 1rem', backgroundColor: '#00bcd4', color: '#fff', borderRadius: '4px', textAlign: 'center', flex: 1, fontWeight: 'bold' }}
                >
                  View Brief
                </Link>
                <button 
                  onClick={() => handleRemove(candidate.username)}
                  style={{ padding: '0.5rem 1rem', backgroundColor: '#ff5252', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
