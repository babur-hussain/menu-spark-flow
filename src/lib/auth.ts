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

class AuthService {
  private currentUser: AuthUser | null = null;
  private session: Session | null = null;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    // Try to recover session from localStorage first
    const cached = localStorage.getItem('sb-session');
    if (cached) {
      try { this.session = JSON.parse(cached); } catch {}
    }
    const { data: { session } } = await supabase.auth.getSession();
    this.session = session || this.session;
    
    if (session?.user) {
      await this.fetchUserProfile(session.user.id);
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      this.session = session;
      if (session) {
        localStorage.setItem('sb-session', JSON.stringify(session));
      }
      
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

      // Regular Supabase authentication only
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: credentials.email, 
        password: credentials.password 
      });

      if (error) {
        console.error('Supabase auth error:', error);
        
        // Handle specific error cases
        if (error.message?.includes('Email not confirmed')) {
          return { success: false, error: 'Email not confirmed. Please check your email and click the confirmation link.' };
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
      const msg = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: msg };
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

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        console.error('Registration error:', authError);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'User creation failed' };
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: data.email,
          role: 'restaurant_manager',
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Try to delete the auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { success: false, error: 'Failed to create user profile' };
      }

      // If restaurant details provided, create restaurant
      if (data.restaurant_name) {
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .insert({
            name: data.restaurant_name,
            description: data.restaurant_description || '',
            address: data.restaurant_address || '',
            phone: data.restaurant_phone || '',
            email: data.restaurant_email || data.email,
            is_active: true,
          })
          .select()
          .single();

        if (restaurant && !restaurantError) {
          // Update user profile with restaurant ID
          await supabase
            .from('user_profiles')
            .update({ restaurant_id: restaurant.id })
            .eq('id', authData.user.id);
        }
      }

      return { 
        success: true, 
        error: 'Please check your email to confirm your account before logging in.' 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }

  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      await supabase.auth.signOut();
      this.currentUser = null;
      localStorage.removeItem('sb-session');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.currentUser;
  }

  async refreshUser(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await this.fetchUserProfile(user.id);
    }
  }

  hasRole(role: 'restaurant_manager' | 'super_admin'): boolean {
    return this.currentUser?.role === role;
  }
}

export const authService = new AuthService(); 