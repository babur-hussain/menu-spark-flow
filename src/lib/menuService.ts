import { supabase } from "../integrations/supabase/client";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string; // We'll map category_id to category name
  preparation_time: number;
  calories?: number;
  allergens?: string[];
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_available: boolean;
  is_featured: boolean;
  is_spicy: boolean;
  dietary_info: string[];
  addons: Array<{id: string; name: string; price: number}>;
  variants: Array<{id: string; name: string; price: number}>;
  badges: string[];
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
  is_featured: boolean;
  is_spicy: boolean;
  dietary_info: string[];
  addons: Array<{id: string; name: string; price: number}>;
  variants: Array<{id: string; name: string; price: number}>;
  badges: string[];
  image_url?: string;
}

export const menuService = {
  async getCategoryName(categoryId: string): Promise<string> {
    const { data } = await supabase
      .from('menu_categories')
      .select('name')
      .eq('id', categoryId)
      .single();
    return data?.name || 'Uncategorized';
  },
  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    try {
      // First, get or create default categories for the restaurant
      await this.ensureDefaultCategories(restaurantId);
      
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          menu_categories!inner(name)
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching menu items:', error);
        throw error;
      }

      // Transform the data to match our interface
      return (data || []).map(item => ({
        ...item,
        category: item.menu_categories?.name || 'Uncategorized',
        is_vegetarian: item.dietary_info?.includes('vegetarian') || false,
        is_vegan: item.dietary_info?.includes('vegan') || false,
        is_gluten_free: item.dietary_info?.includes('gluten_free') || false,
        is_featured: item.dietary_info?.includes('featured') || false,
        is_spicy: item.dietary_info?.includes('spicy') || false,
        dietary_info: item.dietary_info || [],
        addons: item.addons || [],
        variants: item.variants || [],
        badges: item.badges || [],
        calories: undefined, // Not in DB schema
      }));
    } catch (error) {
      console.error('Error in getMenuItems:', error);
      throw error;
    }
  },

  async ensureDefaultCategories(restaurantId: string): Promise<void> {
    const defaultCategories = [
      'Appetizers',
      'Main Course', 
      'Desserts',
      'Beverages',
      'Salads',
      'Soups',
      'Pasta',
      'Pizza',
      'Burgers',
      'Seafood',
      'Grill',
      'Kids Menu'
    ];

    for (const categoryName of defaultCategories) {
      const { data: existing } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('name', categoryName)
        .single();

      if (!existing) {
        await supabase
          .from('menu_categories')
          .insert({
            restaurant_id: restaurantId,
            name: categoryName,
            description: `${categoryName} items`,
            sort_order: defaultCategories.indexOf(categoryName)
          });
      }
    }
  },

  async getCategories(restaurantId: string): Promise<{ id: string; name: string }[]> {
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('id, name')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCategories:', error);
      throw error;
    }
  },

  async createMenuItem(restaurantId: string, menuItem: CreateMenuItemData): Promise<MenuItem> {
    try {
      // Get or create the category
      const categoryId = await this.getOrCreateCategory(restaurantId, menuItem.category);

      // Some deployments may not include optional columns (addons/variants/dietary_info/badges/calories/allergens)
      // Insert with a minimal, widely compatible payload

      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          restaurant_id: restaurantId,
          category_id: categoryId,
          name: menuItem.name,
          description: menuItem.description,
          price: menuItem.price,
          preparation_time: menuItem.preparation_time,
          is_available: menuItem.is_available,
          image_url: menuItem.image_url,
        })
        .select(`*`)
        .single();

      if (error) {
        console.error('Error creating menu item:', error);
        throw error;
      }

      // Transform the response to match our interface
      const categoryName = await this.getCategoryName(data.category_id);
      return {
        ...data,
        category: categoryName,
        is_vegetarian: false,
        is_vegan: false,
        is_gluten_free: false,
        is_featured: false,
        is_spicy: false,
        dietary_info: [],
        addons: [],
        variants: [],
        badges: [],
        calories: undefined,
      };
    } catch (error) {
      console.error('Error in createMenuItem:', error);
      throw error;
    }
  },

  async getOrCreateCategory(restaurantId: string, categoryName: string): Promise<string> {
    // Try to find existing category
    const { data: existing } = await supabase
      .from('menu_categories')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('name', categoryName)
      .single();

    if (existing) {
      return existing.id;
    }

    // Create new category
    const { data: newCategory, error } = await supabase
      .from('menu_categories')
      .insert({
        restaurant_id: restaurantId,
        name: categoryName,
        description: `${categoryName} items`,
        sort_order: 999
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating category:', error);
      throw error;
    }

    return newCategory.id;
  },

  async updateMenuItem(id: string, updates: Partial<CreateMenuItemData>): Promise<MenuItem> {
    try {
      let categoryId: string | undefined;
      
      if (updates.category) {
        // Get the restaurant_id for this menu item
        const { data: currentItem } = await supabase
          .from('menu_items')
          .select('restaurant_id')
          .eq('id', id)
          .single();

        if (currentItem) {
          categoryId = await this.getOrCreateCategory(currentItem.restaurant_id, updates.category);
        }
      }

      const updateData: Record<string, unknown> = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      if (categoryId) {
        updateData.category_id = categoryId;
        delete updateData.category;
      }

      // Remove flags not present in minimal schema
      delete updateData.is_vegetarian;
      delete updateData.is_vegan;
      delete updateData.is_gluten_free;

      const { data, error } = await supabase
        .from('menu_items')
        .update(updateData)
        .eq('id', id)
        .select(`*`)
        .single();

      if (error) {
        console.error('Error updating menu item:', error);
        throw error;
      }

      const categoryName = await this.getCategoryName(data.category_id);
      return {
        ...data,
        category: categoryName,
        is_vegetarian: data.dietary_info?.includes('vegetarian') || false,
        is_vegan: data.dietary_info?.includes('vegan') || false,
        is_gluten_free: data.dietary_info?.includes('gluten_free') || false,
        calories: undefined,
      };
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
        .select(`*`)
        .single();

      if (error) {
        console.error('Error toggling menu item availability:', error);
        throw error;
      }

      const categoryName = await this.getCategoryName(data.category_id);
      return {
        ...data,
        category: categoryName,
        is_vegetarian: data.dietary_info?.includes('vegetarian') || false,
        is_vegan: data.dietary_info?.includes('vegan') || false,
        is_gluten_free: data.dietary_info?.includes('gluten_free') || false,
        calories: undefined,
      };
    } catch (error) {
      console.error('Error in toggleMenuItemAvailability:', error);
      throw error;
    }
  },
}; 