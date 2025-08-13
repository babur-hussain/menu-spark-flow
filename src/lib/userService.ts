import { supabase, forceRealMode } from "../integrations/supabase/client";

export interface User {
  id: string;
  email: string;
  role: 'restaurant_manager' | 'super_admin';
  status: 'active' | 'inactive' | 'pending';
  restaurant_id?: string;
  restaurant_name?: string;
  created_at: string;
  last_login?: string;
  is_verified: boolean;
}

export interface CreateUserData {
  email: string;
  password: string;
  role: 'restaurant_manager' | 'super_admin';
  restaurant_id?: string;
}

export interface UpdateUserData {
  email?: string;
  role?: 'restaurant_manager' | 'super_admin';
  status?: 'active' | 'inactive' | 'pending';
  restaurant_id?: string;
}

export const userService = {
  // Get all users with their restaurant information
  async getUsers(): Promise<User[]> {
    try {
      const { data: userProfiles, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          restaurants!user_profiles_restaurant_id_fkey(
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        if (forceRealMode) throw error;
        return [];
      }

      return userProfiles?.map(profile => ({
        id: profile.id,
        email: profile.email,
        role: profile.role,
        status: profile.is_active ? 'active' : 'inactive',
        restaurant_id: profile.restaurant_id,
        restaurant_name: profile.restaurants?.name,
        created_at: profile.created_at,
        last_login: profile.last_login,
        is_verified: true, // Assuming verified if in user_profiles
      })) || [];
    } catch (error) {
      console.error('Error in getUsers:', error);
      throw error;
    }
  },

  // Get a single user by ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          restaurants!user_profiles_restaurant_id_fkey(
            id,
            name
          )
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        throw error;
      }

      if (!userProfile) return null;

      return {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role,
        status: userProfile.is_active ? 'active' : 'inactive',
        restaurant_id: userProfile.restaurant_id,
        restaurant_name: userProfile.restaurants?.name,
        created_at: userProfile.created_at,
        last_login: userProfile.last_login,
        is_verified: true,
      };
    } catch (error) {
      console.error('Error in getUserById:', error);
      throw error;
    }
  },

  // Create a new user
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      // First create the auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm email
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        throw authError;
      }

      if (!authUser.user) {
        throw new Error('Failed to create auth user');
      }

      // Then create the user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authUser.user.id,
          email: userData.email,
          role: userData.role,
          restaurant_id: userData.restaurant_id,
          is_active: true,
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        throw profileError;
      }

      return {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role,
        status: 'active',
        restaurant_id: userProfile.restaurant_id,
        created_at: userProfile.created_at,
        is_verified: true,
      };
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  },

  // Update a user
  async updateUser(userId: string, updateData: UpdateUserData): Promise<User> {
    try {
      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .update({
          email: updateData.email,
          role: updateData.role,
          restaurant_id: updateData.restaurant_id,
          is_active: updateData.status === 'active',
        })
        .eq('id', userId)
        .select(`
          *,
          restaurants!user_profiles_restaurant_id_fkey(
            id,
            name
          )
        `)
        .single();

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }

      return {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role,
        status: userProfile.is_active ? 'active' : 'inactive',
        restaurant_id: userProfile.restaurant_id,
        restaurant_name: userProfile.restaurants?.name,
        created_at: userProfile.created_at,
        last_login: userProfile.last_login,
        is_verified: true,
      };
    } catch (error) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  },

  // Delete a user
  async deleteUser(userId: string): Promise<void> {
    try {
      // First delete the user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Error deleting user profile:', profileError);
        throw profileError;
      }

      // Then delete the auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('Error deleting auth user:', authError);
        throw authError;
      }
    } catch (error) {
      console.error('Error in deleteUser:', error);
      throw error;
    }
  },

  // Get all restaurants for dropdown
  async getRestaurants(): Promise<{ id: string; name: string }[]> {
    try {
      const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error fetching restaurants:', error);
        if (forceRealMode) throw error;
        return [];
      }

      return restaurants || [];
    } catch (error) {
      console.error('Error in getRestaurants:', error);
      throw error;
    }
  },

  // Update user status
  async updateUserStatus(userId: string, status: 'active' | 'inactive' | 'pending'): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          is_active: status === 'active',
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateUserStatus:', error);
      throw error;
    }
  },
}; 