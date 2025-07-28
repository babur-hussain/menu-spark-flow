import { supabase } from "../integrations/supabase/client";

export async function simpleSetupDatabase() {
  try {
    console.log("Starting simple database setup...");

    // Get current user for restaurant creation
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id || "00000000-0000-0000-0000-000000000000";

    console.log("Current user ID:", currentUserId);

    // Create sample restaurants if they don't exist
    const { data: existingRestaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1);

    if (restaurantsError) {
      console.log("Error checking existing restaurants:", restaurantsError);
    }

    if (!existingRestaurants || existingRestaurants.length === 0) {
      console.log("Creating sample restaurants...");
      
      const sampleRestaurants = [
        {
          user_id: currentUserId,
          name: "Sample Restaurant",
          description: "A great restaurant with amazing food",
          address: "123 Main St, City, State 12345",
          phone: "+1 (555) 123-4567",
          email: "info@samplerestaurant.com",
          website: "https://samplerestaurant.com",
        },
        {
          user_id: currentUserId,
          name: "Gourmet Bistro",
          description: "Fine dining experience",
          address: "456 Oak Ave, City, State 12345",
          phone: "+1 (555) 987-6543",
          email: "info@gourmetbistro.com",
          website: "https://gourmetbistro.com",
        }
      ];

      for (const restaurant of sampleRestaurants) {
        const { error } = await supabase
          .from('restaurants')
          .insert(restaurant);
        
        if (error) {
          console.log("Error creating restaurant:", error);
        } else {
          console.log("Created restaurant:", restaurant.name);
        }
      }
    } else {
      console.log("Restaurants already exist, skipping creation");
    }

    // Create sample menu categories
    const { data: existingCategories, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('id')
      .limit(1);

    if (categoriesError) {
      console.log("Error checking existing categories:", categoriesError);
    }

    if (!existingCategories || existingCategories.length === 0) {
      console.log("Creating sample menu categories...");
      
      const sampleCategories = [
        { name: "Appetizers", description: "Start your meal right" },
        { name: "Main Course", description: "Delicious main dishes" },
        { name: "Desserts", description: "Sweet endings" },
        { name: "Beverages", description: "Refreshing drinks" },
        { name: "Salads", description: "Fresh and healthy" },
        { name: "Soups", description: "Warm and comforting" },
        { name: "Pasta", description: "Italian favorites" },
        { name: "Pizza", description: "Perfect pies" },
        { name: "Burgers", description: "Juicy and delicious" },
        { name: "Seafood", description: "Fresh from the sea" },
        { name: "Grill", description: "Char-grilled perfection" },
        { name: "Kids Menu", description: "Little ones love these" }
      ];

      // Get restaurant IDs
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('id');

      if (restaurants) {
        for (const restaurant of restaurants) {
          for (let i = 0; i < sampleCategories.length; i++) {
            const { error } = await supabase
              .from('menu_categories')
              .insert({
                restaurant_id: restaurant.id,
                name: sampleCategories[i].name,
                description: sampleCategories[i].description,
                sort_order: i
              });
            
            if (error) {
              console.log("Error creating category:", error);
            } else {
              console.log("Created category:", sampleCategories[i].name);
            }
          }
        }
      }
    } else {
      console.log("Categories already exist, skipping creation");
    }

    // Create sample menu items
    const { data: existingMenuItems, error: menuItemsError } = await supabase
      .from('menu_items')
      .select('id')
      .limit(1);

    if (menuItemsError) {
      console.log("Error checking existing menu items:", menuItemsError);
    }

    if (!existingMenuItems || existingMenuItems.length === 0) {
      console.log("Creating sample menu items...");
      
      // Get categories for each restaurant
      const { data: categories } = await supabase
        .from('menu_categories')
        .select('id, name, restaurant_id');

      if (categories) {
        const sampleMenuItems = [
          {
            name: "Caesar Salad",
            description: "Fresh romaine lettuce with Caesar dressing, croutons, and parmesan cheese",
            price: 12.99,
            preparation_time: 10,
            dietary_info: ["vegetarian"],
            allergens: ["dairy", "gluten"],
            is_available: true,
            is_featured: true
          },
          {
            name: "Gourmet Burger",
            description: "Juicy beef patty with lettuce, tomato, onion, and special sauce",
            price: 18.99,
            preparation_time: 15,
            dietary_info: [],
            allergens: ["gluten"],
            is_available: true,
            is_featured: true
          },
          {
            name: "Margherita Pizza",
            description: "Classic pizza with tomato sauce, mozzarella, and fresh basil",
            price: 22.99,
            preparation_time: 20,
            dietary_info: ["vegetarian"],
            allergens: ["dairy", "gluten"],
            is_available: true,
            is_featured: false
          },
          {
            name: "Chocolate Lava Cake",
            description: "Warm chocolate cake with molten center, served with vanilla ice cream",
            price: 9.99,
            preparation_time: 8,
            dietary_info: ["vegetarian"],
            allergens: ["dairy", "eggs", "gluten"],
            is_available: true,
            is_featured: true
          },
          {
            name: "Grilled Salmon",
            description: "Fresh Atlantic salmon grilled to perfection with seasonal vegetables",
            price: 28.99,
            preparation_time: 18,
            dietary_info: [],
            allergens: ["fish"],
            is_available: true,
            is_featured: false
          }
        ];

        // Group categories by restaurant
        const categoriesByRestaurant = categories.reduce((acc, category) => {
          if (!acc[category.restaurant_id]) {
            acc[category.restaurant_id] = [];
          }
          acc[category.restaurant_id].push(category);
          return acc;
        }, {} as Record<string, any[]>);

        // Create menu items for each restaurant
        for (const restaurantId in categoriesByRestaurant) {
          const restaurantCategories = categoriesByRestaurant[restaurantId];
          
          for (let i = 0; i < sampleMenuItems.length; i++) {
            const item = sampleMenuItems[i];
            const category = restaurantCategories[i % restaurantCategories.length];
            
            const { error } = await supabase
              .from('menu_items')
              .insert({
                restaurant_id: restaurantId,
                category_id: category.id,
                name: item.name,
                description: item.description,
                price: item.price,
                preparation_time: item.preparation_time,
                dietary_info: item.dietary_info,
                allergens: item.allergens,
                is_available: item.is_available,
                is_featured: item.is_featured,
                sort_order: i
              });
            
            if (error) {
              console.log("Error creating menu item:", error);
            } else {
              console.log("Created menu item:", item.name);
            }
          }
        }
      }
    } else {
      console.log("Menu items already exist, skipping creation");
    }

    console.log("Simple database setup completed successfully!");
    return { success: true, message: "Database setup completed successfully!" };
  } catch (error) {
    console.error("Error in simple database setup:", error);
    throw new Error(`Database setup failed: ${error.message}`);
  }
} 