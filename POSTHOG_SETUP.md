# PostHog Session Replay Setup

PostHog session replays have been successfully configured for your Redactify project! 🎉

## What's been configured:

1. **PostHog dependency installed**: `posthog-js` package
2. **Provider component created**: `src/app/components/PostHogProvider.tsx`
3. **App wrapped with provider**: Updated `src/app/layout.tsx`
4. **Session replay settings enabled**:
   - Cross-origin iframe recording
   - Console log recording  
   - Performance tracking
   - Input masking for sensitive data (passwords, credit cards)

## Setup Instructions:

### 1. Create Environment Variables

Create a `.env.local` file in your project root with the following:

```env
# PostHog Configuration
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Note**: For EU users, use `https://eu.i.posthog.com` as the host.

### 2. Get Your PostHog API Key

1. Go to [PostHog](https://posthog.com) and create an account or sign in
2. Create a new project or select an existing one
3. Go to Project Settings → Project Variables
4. Copy your "Project API Key" 
5. Replace `your_posthog_project_api_key_here` in your `.env.local` file

### 3. Session Replay Configuration

The session replay is configured with the following settings:

- **Recording Rate**: Currently set to record all sessions (for testing)
- **Console Logs**: Enabled for debugging
- **Performance Tracking**: Enabled
- **Input Masking**: Passwords and credit card numbers are masked
- **Cross-origin Iframes**: Enabled for full coverage

### 4. Privacy & GDPR Compliance

The current configuration includes:
- Sensitive input masking (passwords, credit cards)
- Email and name inputs are NOT masked (adjust as needed)
- Session recording can be disabled per user if needed

### 5. Customization Options

You can customize the PostHog configuration in `src/app/components/PostHogProvider.tsx`:

- **Sampling Rate**: Adjust session recording percentage
- **Input Masking**: Modify which inputs are masked
- **Additional Features**: Enable/disable specific tracking features

### 6. Viewing Session Replays

Once configured:
1. Start your development server: `npm run dev`
2. Use your app normally
3. Go to your PostHog dashboard
4. Navigate to "Session Replays" to view recordings

### 7. Production Considerations

For production:
- Consider reducing the session recording percentage
- Review privacy settings and input masking
- Ensure compliance with your privacy policy
- Test thoroughly before deploying

## Troubleshooting

If session replays aren't working:
1. Check that your API key is correct in `.env.local`
2. Verify the PostHog host URL matches your region
3. Check browser console for any PostHog errors
4. Ensure you're using the app after the configuration

## Resources

- [PostHog Session Replay Docs](https://posthog.com/docs/session-replay)
- [PostHog Privacy Controls](https://posthog.com/docs/privacy)
- [Next.js Integration Guide](https://posthog.com/docs/libraries/next-js)
