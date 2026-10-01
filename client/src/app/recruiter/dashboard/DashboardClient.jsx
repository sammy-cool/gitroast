'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardStats } from '../../../services/recruiterService';

/**
 * EDU: The DashboardClient component provides a high-level overview and a quick
 * search bar to analyze specific developers. It uses light mode Luminous UI variables.
 */
export default function DashboardClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // EDU: Fetch dashboard stats on component mount
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // EDU: Navigate to the analyze page for the specific developer
      router.push(`/recruiter/dashboard/analyze/${searchQuery.trim()}`);
    }
  };

  return (
    <div>
      <h1 style={{ color: '#333', marginBottom: '1.5rem' }}>Recruiter Dashboard</h1>
      
      {/* Quick Search */}
      <div style={{ backgroundColor: 'var(--bg-card, #f8f9fa)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#00bcd4' }}>Analyze a Developer</h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            placeholder="GitHub Username"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#333' }}
          />
          <button type="submit" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#00bcd4', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Analyze
          </button>
        </form>
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div style={{ backgroundColor: 'var(--bg-card, #f8f9fa)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: 0, color: '#666', fontSize: '1rem' }}>Saved Candidates</h3>
          <p style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#00bcd4' }}>{stats?.savedCount || 0}</p>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card, #f8f9fa)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: 0, color: '#666', fontSize: '1rem' }}>Analyses Performed</h3>
          <p style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#00bcd4' }}>{stats?.analysisCount || 0}</p>
        </div>
      </div>
    </div>
  );
}
