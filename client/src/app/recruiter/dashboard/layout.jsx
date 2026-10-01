'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

/**
 * EDU: This layout provides a consistent navigation shell for all recruiter dashboard pages.
 * It uses Project Luminous light mode styling, emphasizing clean whites and cyan accents.
 */
export default function RecruiterDashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // EDU: Remove the token and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gitroast_recruiter_token');
    }
    router.push('/recruiter/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary, #ffffff)' }}>
      {/* Sidebar Navigation */}
      <nav style={{ width: '250px', backgroundColor: 'var(--bg-card, #f8f9fa)', padding: '2rem', borderRight: '1px solid #e0e0e0' }}>
        <h2 style={{ color: '#00bcd4', marginBottom: '2rem' }}>GitRoast Recruiter</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '1rem' }}>
            <Link 
              href="/recruiter/dashboard" 
              style={{ textDecoration: 'none', color: pathname === '/recruiter/dashboard' ? '#00bcd4' : '#333', fontWeight: pathname === '/recruiter/dashboard' ? 'bold' : 'normal' }}
            >
              Dashboard
            </Link>
          </li>
          <li style={{ marginBottom: '1rem' }}>
            <Link 
              href="/recruiter/dashboard/saved" 
              style={{ textDecoration: 'none', color: pathname === '/recruiter/dashboard/saved' ? '#00bcd4' : '#333', fontWeight: pathname === '/recruiter/dashboard/saved' ? 'bold' : 'normal' }}
            >
              Saved Candidates
            </Link>
          </li>
          <li style={{ marginTop: '2rem' }}>
            <button 
              onClick={handleLogout}
              style={{ backgroundColor: 'transparent', border: 'none', color: '#ff5252', cursor: 'pointer', padding: 0, fontSize: '1rem' }}
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem', color: '#333' }}>
        {children}
      </main>
    </div>
  );
}
