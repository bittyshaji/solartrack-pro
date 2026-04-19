# SolarTrack Pro - Authentication Flow

**How authentication works in detail**

## Overview

```
┌─────────────────────────────────────────┐
│         Client (React App)              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Login/Signup Form              │   │
│  └──────────────┬──────────────────┘   │
│                 │                       │
│                 v                       │
│  ┌─────────────────────────────────┐   │
│  │  Submit Credentials via HTTPS   │   │
│  └──────────────┬──────────────────┘   │
│                 │                       │
└─────────────────┼───────────────────────┘
                  │
                  v
┌─────────────────────────────────────────┐
│      Supabase Auth Service              │
│      (Email/Password or OAuth)          │
└──────────────┬──────────────────────────┘
               │
               v
       ┌───────────────────┐
       │ Verify Credentials│
       │ Hash Password     │
       │ Generate JWT      │
       └───────────────────┘
               │
               v
    ┌──────────────────────┐
    │ Return JWT + User ID │
    └──────────────────────┘
               │
               v
┌─────────────────────────────────────────┐
│         Client (React App)              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Store JWT in localStorage      │   │
│  │  Set Auth Context               │   │
│  │  Redirect to Dashboard          │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Sign Up Flow

1. **User enters credentials**
   - Email (validated email format)
   - Password (validated: 8+ chars, mixed case, numbers, special chars)
   - Company name
   - Phone number
   - Accept terms & privacy

2. **Client sends to Supabase**
   ```javascript
   const { data, error } = await supabase.auth.signUp({
     email: 'user@example.com',
     password: 'SecurePass123!',
     options: {
       data: {
         firstName: 'John',
         lastName: 'Doe',
         companyName: 'ABC Solar',
         phone: '555-1234',
       }
     }
   })
   ```

3. **Supabase creates account**
   - Hash password with bcrypt
   - Create user in auth.users table
   - Create user_profiles record
   - Set approval_status to 'pending'

4. **Send verification email**
   - Email contains verification link
   - Link includes token valid for 24 hours

5. **User verifies email**
   - Click link in email
   - Confirms email ownership
   - User can now login

6. **Account approval workflow (optional)**
   - Admin reviews pending users
   - Approve or reject via dashboard
   - User can login only if approved

---

## Sign In Flow

1. **User enters credentials**
   - Email
   - Password
   - Optional: Remember me checkbox

2. **Client sends request**
   ```javascript
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'user@example.com',
     password: 'SecurePass123!'
   })
   ```

3. **Supabase validates**
   - Check email exists
   - Verify password matches (bcrypt)
   - Generate JWT token (1 hour expiration)
   - Generate refresh token (7 day expiration)
   - Return to client

4. **Client stores tokens**
   ```javascript
   // JWT stored in localStorage
   localStorage.setItem('supabase.auth.token', jwtToken)
   localStorage.setItem('supabase.auth.refreshToken', refreshToken)
   ```

5. **Client updates state**
   ```javascript
   // AuthContext updated
   setUser(authUser)
   setLoading(false)
   
   // Fetch user profile
   fetchProfile(authUser)
   ```

6. **Redirect to dashboard**
   - User can now access protected routes
   - API requests include JWT in headers

---

## Token Management

### JWT Token

- **Format**: JSON Web Token (RFC 7519)
- **Expiration**: 1 hour
- **Stored**: localStorage
- **Sent with**: Every API request in Authorization header
- **Content**: User ID, email, role, expiration

### Refresh Token

- **Expiration**: 7 days
- **Rotation**: Supabase auto-rotates on refresh
- **Purpose**: Get new JWT when expired
- **Sent**: In Authorization header

### Token Refresh

```javascript
// Automatic on each session check
const { data, error } = await supabase.auth.refreshSession()

// Returns new JWT if refresh token valid
// Stored automatically in localStorage
```

---

## OAuth / SSO Flow

### Google OAuth Example

1. **User clicks "Sign in with Google"**
   ```javascript
   const { data, error } = await supabase.auth.signInWithOAuth({
     provider: 'google',
     options: {
       redirectTo: 'https://example.com/dashboard'
     }
   })
   ```

2. **Redirects to Google login**
   - User authenticates with Google
   - Grants app permission to access profile
   - Google redirects back with auth code

3. **Supabase validates code**
   - Exchanges code for Google user info
   - Creates Supabase user if doesn't exist
   - Generates JWT + refresh token

4. **Returns to app**
   - Redirects to specified URL
   - App session established
   - User logged in

---

## Password Reset Flow

### Request Reset

1. **User enters email**
   ```javascript
   const { data, error } = await supabase.auth.resetPasswordForEmail(
     'user@example.com'
   )
   ```

2. **Supabase sends email**
   - Email contains reset link
   - Link includes time-limited token (1 hour)
   - No account info leaked (generic response)

3. **User clicks link**
   - Opens reset form with token in URL
   - User enters new password
   - Password validated (strong requirements)

4. **Submit reset**
   ```javascript
   const { data, error } = await supabase.auth.updateUser({
     password: 'NewSecurePass123!'
   })
   ```

5. **Supabase updates**
   - Hash new password
   - Invalidate old sessions
   - Invalidate reset token

6. **User logs in with new password**

---

## Session Management

### Check Session on App Load

```javascript
useEffect(() => {
  // Get current session
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user || null)
    setLoading(false)
    
    // Fetch profile if user exists
    if (session?.user) {
      fetchProfile(session.user)
    }
  })
}, [])
```

### Listen for Auth Changes

```javascript
useEffect(() => {
  // Subscribe to auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user || null)
      fetchProfile(session?.user)
    }
  )
  
  // Cleanup
  return () => subscription?.unsubscribe()
}, [])
```

### Sign Out

```javascript
const handleLogout = async () => {
  const { error } = await supabase.auth.signOut()
  
  // Clear localStorage
  localStorage.removeItem('supabase.auth.token')
  localStorage.removeItem('supabase.auth.refreshToken')
  
  // Reset state
  setUser(null)
  setProfile(null)
  
  // Redirect to login
  navigate('/login')
}
```

---

## Authorization

### Role-Based Access

Checked in component:

```javascript
function AdminPanel() {
  const { user, profile } = useAuth()
  
  if (!profile || profile.role !== 'admin') {
    return <Error message="Not authorized" />
  }
  
  return <AdminContent />
}
```

### Approval Status

Additional gate:

```javascript
if (!profile || profile.approval_status !== 'approved') {
  return <PendingApproval />
}
```

### Database Level

RLS policies enforce at database:

```sql
CREATE POLICY "Users access own projects"
  ON projects FOR SELECT
  USING (created_by = auth.uid());
```

---

## Security Measures

### Client Side

- JWT tokens stored in localStorage (vulnerable to XSS)
- Could use httpOnly cookies for better security
- Validate email format before submit
- Validate password strength client-side
- Don't log sensitive data

### Server Side (Supabase)

- Passwords hashed with bcrypt (12 rounds)
- OAuth CSRF protection via state parameter
- Email verification prevents account abuse
- Approval workflow prevents unauthorized access
- RLS policies enforce at database level
- Token expiration (JWT 1 hour, refresh 7 days)

---

## Common Scenarios

### User Closes App During Auth

- Next app load checks for existing session
- If token valid, user logged in automatically
- If token expired, refresh token used
- If refresh token expired, user must login again

### User Changes Password

- Old sessions invalidated
- User must login again with new password
- Refresh token reset

### Account Locked/Disabled

- Admin can deactivate account
- Login attempts fail
- Can request unlock via email

---

## Error Handling

### Invalid Credentials

```javascript
if (error?.status === 401) {
  // Invalid email or password
  showError('Invalid credentials')
}
```

### Account Not Approved

```javascript
if (profile?.approval_status !== 'approved') {
  // Show message: "Your account is pending approval"
  showWaitingMessage()
}
```

### Email Not Verified

```javascript
if (!user?.email_confirmed_at) {
  // Show: "Please verify your email"
  showVerificationPrompt()
}
```

---

## Token Inspection

Check token claims in browser console:

```javascript
// Decode JWT (without verification)
const token = localStorage.getItem('supabase.auth.token')
const payload = JSON.parse(atob(token.split('.')[1]))
console.log(payload)

// Contains:
// {
//   sub: user-id,
//   email: user@example.com,
//   role: user,
//   aud: authenticated,
//   exp: 1234567890,
//   iat: 1234567800
// }
```

---

See also:
- [SYSTEM_DESIGN.md](../SYSTEM_DESIGN.md) - Auth architecture
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
