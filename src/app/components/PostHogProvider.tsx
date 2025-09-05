'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    // Enable session replays
    session_recording: {
      // Record 100% of sessions for testing - adjust as needed
      recordCrossOriginIframes: true,
      // Enable console logs in session replays
      recordConsoleLog: true,
      // Enable performance tracking
      recordPerformance: true,
      // Mask sensitive inputs (passwords, credit cards, etc.)
      maskAllInputs: false,
      maskInputOptions: {
        password: true,
        email: false,
        name: false,
        tel: false,
        address: false,
        creditCardNumber: true,
        iban: true,
      },
    },
    // Additional configuration for better UX
    capture_pageview: false, // We'll manually capture pageviews
    capture_pageleave: true,
    disable_session_recording: false,
  })
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Capture pageview manually for better control
    if (typeof window !== 'undefined') {
      posthog.capture('$pageview')
    }
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
