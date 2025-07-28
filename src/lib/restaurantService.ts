import { supabase } from "@/integrations/supabase/client";

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRestaurantData {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
}

export const restaurantService = {
  async getRestaurants(userId: string): Promise<Restaurant[]> {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching restaurants:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRestaurants:', error);
      throw error;
    }
  },

  async createRestaurant(userId: string, restaurantData: CreateRestaurantData): Promise<Restaurant> {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .insert({
          ...restaurantData,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating restaurant:', error);
        
        // Handle unique constraint violation
        if (error.code === '23505' && error.message.includes('restaurants_user_id_name_unique')) {
          throw new Error(`A restaurant with the name "${restaurantData.name}" already exists. Please choose a different name.`);
        }
        
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createRestaurant:', error);
      throw error;
    }
  },

  async updateRestaurant(restaurantId: string, restaurantData: Partial<CreateRestaurantData>): Promise<Restaurant> {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .update({
          ...restaurantData,
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurantId)
        .select()
        .single();

      if (error) {
        console.error('Error updating restaurant:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateRestaurant:', error);
      throw error;
    }
  },

  async deleteRestaurant(restaurantId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', restaurantId);

      if (error) {
        console.error('Error deleting restaurant:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteRestaurant:', error);
      throw error;
    }
  },

  async getRestaurantById(restaurantId: string): Promise<Restaurant | null> {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (error) {
        console.error('Error fetching restaurant:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getRestaurantById:', error);
      throw error;
    }
  }
}; 