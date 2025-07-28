# Authentication System Documentation

## Overview

The MenuMaster application implements a robust authentication system with role-based access control, secure password validation, and comprehensive session management.

## Security Features

### 🔐 Password Security
- **Minimum Requirements**: 8 characters minimum
- **Complexity Requirements**:
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (!@#$%^&*(),.?":{}|<>)
- **Real-time Validation**: Password strength is checked as users type
- **Secure Storage**: Passwords are hashed using Supabase's built-in security

### 🛡️ Session Management
- **Automatic Session Refresh**: Sessions are refreshed automatically
- **Secure Logout**: Complete session cleanup on logout
- **Rate Limiting**: Protection against brute force attacks
- **Cross-tab Synchronization**: Auth state syncs across browser tabs

### 🔒 Role-Based Access Control
- **Restaurant Manager**: Can manage their own restaurant and menu
- **Super Admin**: Can manage all restaurants and system-wide settings
- **Protected Routes**: Automatic redirection based on user role
- **Permission Checks**: Server-side and client-side validation

## Default Credentials

### Super Admin
```
Email: admin@menumaster.com
Password: Admin@2024!
Role: super_admin
```

### Restaurant Manager (Demo)
```
Email: manager@demo.com
Password: Manager@2024!
Role: restaurant_manager
```

## Database Schema

### User Profiles Table
```sql
CREATE TABLE public.user_profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('restaurant_manager', 'super_admin')),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);
```

### Row Level Security Policies
- Users can only view and update their own profiles
- Super admins can view all profiles
- Automatic profile creation on user registration

## Authentication Flow

### 1. Login Process
```typescript
// User submits credentials
const result = await authService.login({
  email: "user@example.com",
  password: "SecurePass123!",
  role: "restaurant_manager"
});

// System validates credentials
if (result.success) {
  // Redirect to appropriate dashboard
  navigate("/admin/dashboard");
} else {
  // Show error message
  toast.error(result.error);
}
```

### 2. Registration Process
```typescript
// User submits registration data
const result = await authService.register({
  email: "newuser@restaurant.com",
  password: "SecurePass123!",
  confirmPassword: "SecurePass123!",
  restaurant_name: "My Restaurant",
  restaurant_address: "123 Main St",
  restaurant_phone: "+1-555-123-4567",
  restaurant_email: "contact@myrestaurant.com"
});
```

### 3. Session Management
```typescript
// Check if user is authenticated
const isAuthenticated = await authService.isAuthenticated();

// Get current user
const user = await authService.getCurrentUser();

// Check user role
const isAdmin = await authService.hasRole('super_admin');
```

## Protected Routes

### Restaurant Manager Routes
```typescript
<RestaurantManagerRoute>
  <RestaurantDashboard />
</RestaurantManagerRoute>
```

### Super Admin Routes
```typescript
<SuperAdminRoute>
  <SuperAdminDashboard />
</SuperAdminRoute>
```

### General Admin Routes
```typescript
<AdminRoute>
  <AnyAdminComponent />
</AdminRoute>
```

## Components

### AuthProvider
Wraps the application and provides authentication context:
```typescript
<AuthProvider>
  <App />
</AuthProvider>
```

### ProtectedRoute
Handles authentication and role-based access:
```typescript
<ProtectedRoute requiredRole="restaurant_manager">
  <Component />
</ProtectedRoute>
```

### LogoutButton
Provides secure logout functionality:
```typescript
<LogoutButton variant="outline" />
```

## Security Best Practices

### ✅ Implemented
- Password complexity requirements
- Rate limiting for login attempts
- Secure session management
- Role-based access control
- Input validation and sanitization
- HTTPS enforcement (in production)
- Automatic session refresh
- Secure logout with cleanup

### 🔄 Ongoing
- Regular security audits
- Password policy updates
- Session timeout management
- Audit logging implementation

## Error Handling

### Common Error Messages
- **Invalid Credentials**: "Email or password is incorrect"
- **Account Locked**: "Account temporarily locked due to multiple failed attempts"
- **Role Mismatch**: "Invalid role for this account"
- **Session Expired**: "Your session has expired. Please log in again"
- **Network Error**: "Connection error. Please check your internet connection"

### Error Recovery
- Automatic retry for network issues
- Graceful degradation for offline scenarios
- Clear error messages for user guidance
- Fallback to login page for authentication failures

## Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase
- Create a Supabase project
- Run the database migrations
- Configure authentication settings
- Set up Row Level Security policies

### 3. Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Start Development Server
```bash
npm run dev
```

## Testing Authentication

### 1. Test Default Credentials
- Use the provided default credentials to test login
- Verify role-based access control
- Test logout functionality

### 2. Test Registration
- Create a new restaurant manager account
- Verify password validation
- Test restaurant creation flow

### 3. Test Security Features
- Try invalid credentials (should show error)
- Test rate limiting (multiple failed attempts)
- Verify session persistence across tabs

## Troubleshooting

### Common Issues

#### 1. Login Not Working
- Check if Supabase is properly configured
- Verify environment variables
- Check browser console for errors

#### 2. Role Access Issues
- Ensure user profile exists in database
- Verify role is correctly set
- Check RLS policies are active

#### 3. Session Issues
- Clear browser storage
- Check for conflicting auth providers
- Verify Supabase client configuration

### Debug Mode
Enable debug logging by setting:
```typescript
localStorage.setItem('auth_debug', 'true');
```

## API Reference

### AuthService Methods

#### `login(credentials: LoginCredentials)`
Authenticates a user with email, password, and role.

#### `register(data: RegisterData)`
Registers a new restaurant manager account.

#### `logout()`
Securely logs out the current user.

#### `getCurrentUser()`
Returns the current authenticated user.

#### `isAuthenticated()`
Checks if a user is currently authenticated.

#### `hasRole(role: string)`
Checks if the current user has a specific role.

#### `validatePassword(password: string)`
Validates password strength requirements.

## Contributing

When adding new authentication features:

1. **Security First**: Always prioritize security over convenience
2. **Test Thoroughly**: Test all authentication flows
3. **Document Changes**: Update this documentation
4. **Follow Patterns**: Use existing authentication patterns
5. **Validate Input**: Always validate and sanitize user input

## Support

For authentication-related issues:
1. Check the troubleshooting section
2. Review browser console for errors
3. Verify Supabase configuration
4. Test with default credentials
5. Contact development team if issues persist 