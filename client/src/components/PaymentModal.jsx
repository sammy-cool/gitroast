'use client'

// ============================================================
// GITROAST — PaymentModal
// ============================================================
// WHAT: Portal wrapper that renders PaymentFlow as a true
//       fullscreen modal overlay from anywhere in the app.
//
// WHY this component exists (DRY principle):
//   Multiple pages need PaymentFlow as a modal:
//     - pricing/page.jsx
//     - ProModal.jsx
//     - Any future page
//   Without this: every page duplicates portal + overlay code
//   With this: any page does <PaymentModal planId="roaster" onClose={fn}/>
//   Portal and overlay handled once here — never repeated
//
// WHY createPortal:
//   Renders into document.body — bypasses any parent CSS
//   transforms/stacking contexts that break position:fixed
//
// WHY scroll lock:
//   Without it: page behind modal scrolls on mobile/touch
//   Locked on mount, restored exactly on unmount
//
// PROPS:
//   planId  — 'roaster' | 'historian'
//   onClose — called when user cancels or payment completes
//
// WHERE: Used by ProModal.jsx, pricing/page.jsx
// ============================================================

import { useEffect, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import PaymentFlow from './PaymentFlow'

const subscribe = () => () => {}

export default function PaymentModal({ planId, onClose }) {
    const isClient = useSyncExternalStore(subscribe, () => true, () => false)

    // WHY scroll lock on mount/unmount:
    //   Prevents page behind modal from scrolling
    //   Saves previous overflow value and restores it on close
    //   Handles case where multiple modals stack
    useEffect(() => {
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [])

    if (!isClient || typeof document === 'undefined') return null

    return createPortal(
        <div
            style={{
                // WHY all inline styles (not styled-jsx):
                //   This component has no JSX siblings — styled-jsx
                //   needs a sibling <style jsx> tag in same render tree
                //   Inline styles are always reliable for a wrapper like this
                position: 'fixed',
                inset: '0',
                background: 'rgba(0, 0, 0, 0.88)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                backdropFilter: 'blur(6px)',
                zIndex: 9999,
                overflowY: 'auto',
            }}
            // WHY onClick on overlay closes modal:
            //   Click outside = intent to dismiss
            //   Standard UX pattern (Bootstrap, MUI, Radix)
            onClick={onClose}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '560px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    // WHY animation via inline style:
                    //   Can't use CSS class without styled-jsx here
                    //   Simple transform achieves the slide-in effect
                    animation: 'fadeIn 0.2s ease forwards',
                    margin: 'auto',
                    maxHeight: '90dvh',
                    overflowY: 'auto',
                }}
                // WHY stopPropagation:
                //   Prevents click on modal content from bubbling
                //   to overlay onClick (which would close modal)
                onClick={e => e.stopPropagation()}
            >
                <PaymentFlow planId={planId} onClose={onClose} />
            </div>
        </div>,
        document.body
    )
}