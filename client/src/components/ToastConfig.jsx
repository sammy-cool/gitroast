'use client'

// WHY 'use client': setDefaultColors and setDefaultMessages
//     are browser-side functions from the toast package
//     They need window/DOM to work
//     layout.jsx is a server component — cannot call these there
//     This tiny component runs ONLY in the browser
//     and initializes GitRoast brand colors for ALL toasts app-wide

import { useEffect } from 'react'
import {
    setDefaultColors,
    setDefaultMessages,
} from 'customizable-toast-notification'

export default function ToastConfig() {
    useEffect(() => {
        // WHY useEffect: runs only after component mounts in browser
        //     safe to call browser-side toast package here

        // WHY these colors match CSS variables exactly:
        //   --good  = #00E676  → success (roast ready, payment confirmed)
        //   --bad   = #FF3D3D  → error   (user not found, payment failed)
        //   --warn  = #FFB700  → warning (rate limit, cancelled)
        //   --fire-mid = #FF6B00 → info  (Pro CTA, heads up)
        setDefaultColors({
            success: '#00E676',
            error: '#FF3D3D',
            warning: '#FFB700',
            info: '#FF6B00',
        })

        // WHY these messages: fallback when no message is passed
        //     voice matches GitRoast brand — direct, slightly savage
        setDefaultMessages({
            success: 'Done! 🔥',
            error: 'Something went wrong. Try again.',
            warning: 'Hold on a second.',
            info: 'Heads up!',
        })
    }, [])
    // WHY null: this component renders nothing visually
    //     it only runs side effects
    return null
}