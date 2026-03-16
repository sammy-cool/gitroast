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
        // WHY: only called when validation passes
        onSubmit(data.username)
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

                <input
                    type="text"
                    placeholder="your-username"
                    autoComplete="off"
                    autoCapitalize="off"
                    className="username-input font-mono"
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    {...register('username', {
                        required: 'GitHub username is required',
                        minLength: { value: 1, message: 'Too short' },
                        maxLength: { value: 39, message: 'GitHub usernames max 39 chars' },
                        // WHY pattern: GitHub username rules
                        //     only letters, numbers, hyphens allowed
                        pattern: {
                            value: /^[a-zA-Z0-9-]+$/,
                            message: 'Only letters, numbers, hyphens allowed',
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
                🔥 Roast My GitHub
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