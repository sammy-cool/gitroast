'use client'

// WHY react-hook-form: handles input validation cleanly
//     without messy manual onChange + error state
import { useForm } from 'react-hook-form'
import { useState } from 'react'

export default function UsernameInput({ onSubmit }) {
    const [focused, setFocused] = useState(false)

    const {
        register,    // WHY: connects input to the form
        handleSubmit, // WHY: runs our function only if validation passes
        formState: { errors }, // WHY: gives us error messages to show user
    } = useForm()

    function onValid(data) {
        let val = (data.username || '').trim()
        val = val.replace(/^https?:\/\/github\.com\//i, '').replace(/^github\.com\//i, '').replace(/^\/+|\/+$/g, '')
        onSubmit(val)
    }

    return (
        <form
            onSubmit={handleSubmit(onValid)}
            className="username-form"
            noValidate // WHY: we handle validation ourselves, not browser
        >
            {/* ── Input row ── */}
            <div
                className="input-wrap"
                style={{
                    borderColor: focused
                        ? 'var(--border-focus)'
                        : errors.username
                            ? 'var(--bad)'
                            : 'var(--border)',
                }}
            >
                {/* WHY prefix: shows github.com/ so user knows what to type */}
                <div className="input-prefix font-mono">github.com/</div>

                {/* 
                  ── WHAT: ────────────────────────────────────────────────────────
                  Accessible text input for GitHub usernames and repositories.
                  
                  ── WHY: ─────────────────────────────────────────────────────────
                  Provides an explicit aria-label for screen readers (WCAG 2.1 AA)
                  since the visual github.com/ prefix is presented in a separate div.
                  
                  ── WHERE & WHEN TO USE: ─────────────────────────────────────────
                  All text input fields lacking an explicit <label for="..."> tag.
                  
                  ── USE CASES: ───────────────────────────────────────────────────
                  Home landing roast and repo analysis input.
                  
                  ── WHEN NOT TO USE: ─────────────────────────────────────────────
                  When an input is already wrapped with a dedicated HTML <label>.
                */}
                <input
                    type="text"
                    aria-label="GitHub username or repository (e.g. torvalds/linux)"
                    placeholder="username or owner/repo"
                    autoComplete="off"
                    autoCapitalize="off"
                    className="username-input font-mono"
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    {...register('username', {
                        required: 'GitHub username or repository is required',
                        minLength: { value: 1, message: 'Too short' },
                        maxLength: { value: 120, message: 'Max 120 chars' },
                        // WHY pattern: GitHub username or owner/repo rules, with optional https?:// or github.com/ prefix
                        pattern: {
                            value: /^(?:https?:\/\/)?(?:github\.com\/)?[a-zA-Z0-9-._]+(?:\/[a-zA-Z0-9-._]+)?\/?$/,
                            message: 'Enter a username or owner/repo (e.g. torvalds/linux)',
                        },
                    })}
                />
            </div>

            {/* ── Validation error ── */}
            {errors.username && (
                <p className="input-error font-mono animate-fadeUp">
                    ⚠ {errors.username.message}
                </p>
            )}

            {/* ── Submit button ── */}
            <button type="submit" className="btn btn-primary roast-btn">
                🔥 Roast GitHub / Repo
            </button>

            <style jsx>{`
        .username-form {
          display:        flex;
          flex-direction: column;
          gap:            10px;
          width:          100%;
          max-width:      460px;
        }
        .input-wrap {
          display:       flex;
          border:        1px solid var(--border);
          border-radius: var(--radius-md);
          overflow:      hidden;
          background:    var(--bg-card);
          transition:    border-color 0.2s;
        }
        .input-prefix {
          padding:          0 14px;
          display:          flex;
          align-items:      center;
          background:       var(--bg-input);
          border-right:     1px solid var(--border);
          color:            var(--text-muted);
          font-size:        13px;
          flex-shrink:      0;
          white-space:      nowrap;
        }
        .username-input {
          flex:       1;
          background: transparent;
          border:     none;
          padding:    14px;
          color:      var(--text-primary);
          font-size:  15px;
          outline:    none;
          min-width:  0;
        }
        .username-input::placeholder { color: var(--text-muted); }
        .input-error {
          color:     var(--bad);
          font-size: 12px;
          padding:   0 4px;
        }
        .roast-btn {
          width:          100%;
          padding:        14px;
          font-size:      16px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          border-radius:  var(--radius-md);
        }
      `}</style>
        </form>
    )
}