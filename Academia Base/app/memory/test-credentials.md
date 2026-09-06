# Test Credentials for AcademiaBase

## Email/Password Test Accounts

### Test User 1
- **Email**: test.user1@example.com
- **Password**: testpass123
- **Name**: Test User One
- **Status**: To be created during testing

### Test User 2
- **Email**: test.user2@example.com
- **Password**: testpass456
- **Name**: Test User Two
- **Status**: To be created during testing

## Google OAuth

Google OAuth is fully integrated via Emergent Auth. Users can sign in with their Google accounts by clicking "Continue with Google" on the login or signup pages.

**How it works:**
1. User clicks "Continue with Google" button
2. Redirected to `https://auth.emergentagent.com/?redirect={dashboard_url}`
3. User authenticates with Google
4. Returns with session_id in URL hash
5. Frontend exchanges session_id for session_token via `/api/auth/session`
6. User is logged in and redirected to dashboard

## Testing Notes

- Email/password accounts can be created via the signup page
- Google OAuth accounts are created automatically on first login
- All sessions are valid for 7 days
- Sessions are stored in MongoDB with httpOnly cookies
