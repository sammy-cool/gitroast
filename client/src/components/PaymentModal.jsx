'use client'


import { useRef, useSyncExternalStore } from 'react'
import useModalA11y from '@/hooks/useModalA11y'
import { createPortal } from 'react-dom'
import PaymentFlow from './PaymentFlow'

const subscribe = () => () => {}

export default function PaymentModal({ planId, onClose }) {
    const isClient = useSyncExternalStore(subscribe, () => true, () => false)

    const dialogRef = useRef(null)
    useModalA11y(dialogRef, onClose, isClient)

    if (!isClient || typeof document === 'undefined') return null

    return createPortal(
        <div
            style={{
                position: 'fixed',
                inset: '0',
                background: 'rgba(23, 23, 17, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                backdropFilter: 'blur(6px)',
                zIndex: 9999,
                overflowY: 'auto',
            }}
            onClick={onClose}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label="Checkout"
                style={{
                    width: '100%',
                    maxWidth: '560px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    animation: 'fadeIn 0.2s ease forwards',
                    margin: 'auto',
                    maxHeight: '90dvh',
                    overflowY: 'auto',
                }}
                onClick={e => e.stopPropagation()}
            >
                <PaymentFlow planId={planId} onClose={onClose} />
            </div>
        </div>,
        document.body
    )
}

