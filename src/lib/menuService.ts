import { supabase } from "../integrations/supabase/client";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  preparation_time: number;
  calories?: number;
  allergens?: string[];
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_available: boolean;
  image_url?: string;
  restaurant_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMenuItemData {
  name: string;
  description: string;
  price: number;
  category: string;
  preparation_time: number;
  calories?: number;
  allergens?: string[];
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_available: boolean;
  image_url?: string;
}

export const menuService = {
  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching menu items:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getMenuItems:', error);
      throw error;
    }
  },

  async createMenuItem(restaurantId: string, menuItem: CreateMenuItemData): Promise<MenuItem> {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([{
          ...menuItem,
          restaurant_id: restaurantId,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating menu item:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createMenuItem:', error);
      throw error;
    }
  },

  async updateMenuItem(id: string, updates: Partial<CreateMenuItemData>): Promise<MenuItem> {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating menu item:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateMenuItem:', error);
      throw error;
    }
  },

  async deleteMenuItem(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting menu item:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteMenuItem:', error);
      throw error;
    }
  },

  async toggleMenuItemAvailability(id: string, isAvailable: boolean): Promise<MenuItem> {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .update({
          is_available: isAvailable,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error toggling menu item availability:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in toggleMenuItemAvailability:', error);
      throw error;
    }
  },
}; 