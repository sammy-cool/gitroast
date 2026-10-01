"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useRecruiterAuth } from '@/context/RecruiterAuthContext'
import { toast } from '@/utils/toast'

export default function RecruiterRegisterClient() {
  const router = useRouter()
  const { registerWithEmail, loginWithGoogle } = useRecruiterAuth()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await registerWithEmail(name, email, password, company)
      toast.success('Successfully registered!')
      router.push('/dashboard') // Or wherever recruiters go
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="recruiter-auth-container">
      <div className="recruiter-auth-card">
        <div className="auth-header">
          <h1 className="font-display text-cyan">CREATE ACCOUNT</h1>
          <p>Join as a Recruiter</p>
        </div>

        <div className="auth-actions">
          <button 
            onClick={loginWithGoogle} 
            className="btn btn-outline google-btn"
            type="button"
          >
            <span className="google-icon">G</span>
            Sign up with Google
          </button>
        </div>

        <div className="divider">
          <span>OR</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Jane Doe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label htmlFor="company">Company</label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              placeholder="Tech Corp"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary login-submit-btn font-mono"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link href="/recruiter/login" className="auth-link text-cyan">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .recruiter-auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: #f8fafc;
          color: #0f172a;
        }

        .recruiter-auth-card {
          background: #ffffff;
          padding: 3rem 2rem;
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
          width: 100%;
          max-width: 440px;
          border: 1px solid rgba(0, 229, 255, 0.2);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-header h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          letter-spacing: 1px;
        }

        .auth-header p {
          color: #64748b;
        }

        .text-cyan {
          color: #00bcd4;
        }

        .auth-actions {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-family: var(--font-mono, monospace);
          border-color: #cbd5e1;
          color: #334155;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          background: #ffffff;
          transition: all 0.2s;
          cursor: pointer;
        }

        .google-btn:hover {
          background: #f1f5f9;
        }

        .google-icon {
          font-weight: bold;
          font-size: 1.2rem;
        }

        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 1.5rem 0;
          color: #94a3b8;
          font-size: 0.875rem;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e2e8f0;
        }

        .divider span {
          padding: 0 10px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
        }

        .form-group input {
          padding: 0.75rem 1rem;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input:focus {
          border-color: #00bcd4;
          box-shadow: 0 0 0 3px rgba(0, 188, 212, 0.1);
        }

        .login-submit-btn {
          margin-top: 0.5rem;
          width: 100%;
          padding: 0.75rem;
          background: #00bcd4;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .login-submit-btn:hover:not(:disabled) {
          background: #00acc1;
        }

        .login-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .auth-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.875rem;
          color: #64748b;
        }

        .auth-link {
          font-weight: 600;
          text-decoration: none;
        }

        .auth-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
