import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
  role: 'restaurant_manager' | 'super_admin';
  restaurant_id?: string;
  created_at: string;
  last_login?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: 'restaurant_manager' | 'super_admin';
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  restaurant_name?: string;
  restaurant_description?: string;
  restaurant_address?: string;
  restaurant_phone?: string;
  restaurant_email?: string;
}

// Default admin credentials
export const DEFAULT_ADMIN_CREDENTIALS = {
  email: 'admin@menumaster.com',
  password: 'Admin@2024!',
  role: 'super_admin' as const
};

export const DEFAULT_RESTAURANT_CREDENTIALS = {
  email: 'manager@demo.com',
  password: 'Manager@2024!',
  role: 'restaurant_manager' as const
};

class AuthService {
  private currentUser: AuthUser | null = null;
  private session: Session | null = null;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    this.session = session;
    
    if (session?.user) {
      await this.fetchUserProfile(session.user.id);
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      this.session = session;
      
      if (event === 'SIGNED_IN' && session?.user) {
        await this.fetchUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
      }
    });
  }

  private async fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      this.currentUser = data as AuthUser;
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    try {
      // Validate credentials
      if (!credentials.email || !credentials.password) {
        return { success: false, error: 'Email and password are required' };
      }

      // Check for default credentials first
      if (this.isDefaultCredentials(credentials)) {
        return await this.handleDefaultLogin(credentials);
      }

      // Regular Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        
        // Handle specific error cases
        if (error.message?.includes('Email not confirmed') || error.message?.includes('Invalid login credentials')) {
          return { success: false, error: 'Email not confirmed. Please check your email and click the confirmation link, or try using the demo credentials.' };
        }
        
        if (error.message?.includes('Invalid login credentials')) {
          return { success: false, error: 'Invalid email or password. Please check your credentials.' };
        }
        
        if (error.message?.includes('Too many requests')) {
          return { success: false, error: 'Too many login attempts. Please wait a few minutes before trying again.' };
        }
        
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Authentication failed' };
      }

      // Fetch user profile
      await this.fetchUserProfile(data.user.id);
      
      if (!this.currentUser) {
        return { success: false, error: 'User profile not found' };
      }

      // Verify role matches
      if (this.currentUser.role !== credentials.role) {
        await supabase.auth.signOut();
        return { success: false, error: 'Invalid role for this account' };
      }

      return { success: true, user: this.currentUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  private isDefaultCredentials(credentials: LoginCredentials): boolean {
    return (
      (credentials.email === DEFAULT_ADMIN_CREDENTIALS.email && 
       credentials.password === DEFAULT_ADMIN_CREDENTIALS.password &&
       credentials.role === DEFAULT_ADMIN_CREDENTIALS.role) ||
      (credentials.email === DEFAULT_RESTAURANT_CREDENTIALS.email && 
       credentials.password === DEFAULT_RESTAURANT_CREDENTIALS.password &&
       credentials.role === DEFAULT_RESTAURANT_CREDENTIALS.role)
    );
  }

  private async handleDefaultLogin(credentials: LoginCredentials): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    try {
      // Generate proper UUIDs for default users
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // Create a mock session for default users
      const mockUser: AuthUser = {
        id: credentials.role === 'super_admin' ? generateUUID() : generateUUID(),
        email: credentials.email,
        role: credentials.role,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };

      if (credentials.role === 'restaurant_manager') {
        mockUser.restaurant_id = generateUUID();
      }

      this.currentUser = mockUser;
      
      // Store in localStorage for session management
      localStorage.setItem('default_user', JSON.stringify(mockUser));
      localStorage.setItem('is_default_user', 'true');

      return { success: true, user: mockUser };
    } catch (error) {
      console.error('Default login error:', error);
      return { success: false, error: 'Default login failed' };
    }
  }

  async resendConfirmationEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        console.error('Error resending confirmation email:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error resending confirmation email:', error);
      return { success: false, error: 'Failed to resend confirmation email' };
    }
  }

  async bypassEmailConfirmation(email: string, password: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    try {
      // This is a development-only method to bypass email confirmation
      // In production, you should remove this method
      console.warn('Bypassing email confirmation for development - this should not be used in production');
      
      // Try to sign in with the credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Authentication failed' };
      }

      // Fetch user profile
      await this.fetchUserProfile(data.user.id);
      
      if (!this.currentUser) {
        return { success: false, error: 'User profile not found' };
      }

      return { success: true, user: this.currentUser };
    } catch (error) {
      console.error('Bypass email confirmation error:', error);
      return { success: false, error: 'Failed to bypass email confirmation' };
    }
  }

  async register(data: RegisterData): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    try {
      // Validate input
      if (!data.email || !data.password || !data.confirmPassword) {
        return { success: false, error: 'All fields are required' };
      }

      if (data.password !== data.confirmPassword) {
        return { success: false, error: 'Passwords do not match' };
      }

      if (data.password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters long' };
      }

      // Check rate limiting for this email
      if (this.isRateLimited(data.email)) {
        return { success: false, error: 'Too many registration attempts. Please wait a few minutes before trying again.' };
      }

      // Check if user already exists
      const { data: existingUser, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        
        // Handle specific error cases
        if (signUpError.message?.includes('429') || signUpError.message?.includes('Too Many Requests')) {
          this.recordLoginAttempt(data.email);
          return { success: false, error: 'Too many registration attempts. Please wait a few minutes before trying again.' };
        }
        
        if (signUpError.message?.includes('User already registered')) {
          return { success: false, error: 'An account with this email already exists. Please try logging in instead.' };
        }
        
        if (signUpError.message?.includes('Invalid email')) {
          return { success: false, error: 'Please enter a valid email address.' };
        }
        
        return { success: false, error: signUpError.message || 'Registration failed. Please try again.' };
      }

      if (existingUser?.user) {
        // Create user profile
        const profileData = {
          id: existingUser.user.id,
          email: data.email,
          role: 'restaurant_manager' as const,
          created_at: new Date().toISOString(),
        };

        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert(profileData);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          return { success: false, error: 'Failed to create user profile' };
        }

        // Create restaurant if provided
        if (data.restaurant_name) {
          const restaurantData = {
            user_id: existingUser.user.id,
            name: data.restaurant_name,
            description: data.restaurant_description,
            address: data.restaurant_address,
            phone: data.restaurant_phone,
            email: data.restaurant_email,
          };

          const { error: restaurantError } = await supabase
            .from('restaurants')
            .insert(restaurantData);

          if (restaurantError) {
            console.error('Error creating restaurant:', restaurantError);
            return { success: false, error: 'Failed to create restaurant' };
          }
        }

        return { 
          success: true, 
          user: {
            id: existingUser.user.id,
            email: data.email,
            role: 'restaurant_manager',
            created_at: new Date().toISOString(),
          }
        };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if it's a default user
      const isDefaultUser = localStorage.getItem('is_default_user');
      
      if (isDefaultUser === 'true') {
        // Clear default user data
        localStorage.removeItem('default_user');
        localStorage.removeItem('is_default_user');
        this.currentUser = null;
        return { success: true };
      }

      // Regular Supabase logout
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      this.currentUser = null;
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    // Check for default user first
    const isDefaultUser = localStorage.getItem('is_default_user');
    if (isDefaultUser === 'true') {
      const defaultUser = localStorage.getItem('default_user');
      if (defaultUser) {
        this.currentUser = JSON.parse(defaultUser);
        return this.currentUser;
      }
    }

    // Check Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      if (!this.currentUser || this.currentUser.id !== session.user.id) {
        await this.fetchUserProfile(session.user.id);
      }
    } else {
      this.currentUser = null;
    }

    return this.currentUser;
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  async hasRole(role: 'restaurant_manager' | 'super_admin'): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === role;
  }

  async refreshSession(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session?.user) {
        await this.fetchUserProfile(data.session.user.id);
      }

      return { success: true };
    } catch (error) {
      console.error('Session refresh error:', error);
      return { success: false, error: 'Failed to refresh session' };
    }
  }

  // Password validation utility
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Rate limiting for login attempts
  private loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
  
  private isRateLimited(email: string): boolean {
    const attempts = this.loginAttempts.get(email);
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    
    if (!attempts) {
      return false;
    }
    
    if (now - attempts.lastAttempt > windowMs) {
      this.loginAttempts.delete(email);
      return false;
    }
    
    return attempts.count >= 5; // Max 5 attempts per 15 minutes
  }
  
  private recordLoginAttempt(email: string): void {
    const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
    attempts.count += 1;
    attempts.lastAttempt = Date.now();
    this.loginAttempts.set(email, attempts);
  }
}

export const authService = new AuthService(); 