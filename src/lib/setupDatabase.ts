import { supabase } from "../integrations/supabase/client";

export async function setupDatabase() {
  try {
    console.log("Setting up database...");

    // First, fix the user_profiles policies to prevent infinite recursion
    console.log("Fixing user_profiles policies...");
    try {
      // Drop problematic policies
      await supabase.rpc('exec_sql', { 
        sql: `
          DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
          DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
          DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.user_profiles;
          DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.user_profiles;
        `
      });

      // Create new policies
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE POLICY "Users can view their own profile" 
          ON public.user_profiles 
          FOR SELECT 
          USING (auth.uid() = id);

          CREATE POLICY "Users can update their own profile" 
          ON public.user_profiles 
          FOR UPDATE 
          USING (auth.uid() = id);

          CREATE POLICY "Super admins can view all profiles" 
          ON public.user_profiles 
          FOR SELECT 
          USING (
            EXISTS (
              SELECT 1 FROM public.user_profiles up 
              WHERE up.id = auth.uid() 
              AND up.role = 'super_admin'
            )
          );

          CREATE POLICY "Super admins can manage all profiles" 
          ON public.user_profiles 
          FOR ALL 
          USING (
            EXISTS (
              SELECT 1 FROM public.user_profiles up 
              WHERE up.id = auth.uid() 
              AND up.role = 'super_admin'
            )
          );

          CREATE POLICY "Service role can manage all profiles" 
          ON public.user_profiles 
          FOR ALL 
          USING (auth.role() = 'service_role');
        `
      });
    } catch (policyError) {
      console.log("Policy fix not applied (may need manual SQL execution):", policyError);
      throw new Error(`Failed to fix policies: ${policyError.message}`);
    }

    // Get current user for restaurant creation
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id || "00000000-0000-0000-0000-000000000000";

    // Create sample restaurants if they don't exist
    const { data: existingRestaurants } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1);

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
        await supabase
          .from('restaurants')
          .insert(restaurant);
      }
    }

    // Create sample menu categories
    const { data: existingCategories } = await supabase
      .from('menu_categories')
      .select('id')
      .limit(1);

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
            await supabase
              .from('menu_categories')
              .insert({
                restaurant_id: restaurant.id,
                name: sampleCategories[i].name,
                description: sampleCategories[i].description,
                sort_order: i
              });
          }
        }
      }
    }

    // Create sample menu items
    const { data: existingMenuItems } = await supabase
      .from('menu_items')
      .select('id')
      .limit(1);

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
        }, {} as Record<string, { id: string; name: string; restaurant_id: string }[]>);

        // Create menu items for each restaurant
        for (const restaurantId in categoriesByRestaurant) {
          const restaurantCategories = categoriesByRestaurant[restaurantId];
          
          for (let i = 0; i < sampleMenuItems.length; i++) {
            const item = sampleMenuItems[i];
            const category = restaurantCategories[i % restaurantCategories.length];
            
            await supabase
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
          }
        }
      }
    }

    // Create sample QR codes
    const { data: existingQRCodes } = await supabase
      .from('qr_codes')
      .select('id')
      .limit(1);

    if (!existingQRCodes || existingQRCodes.length === 0) {
      console.log("Creating sample QR codes...");
      
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('id');

      if (restaurants) {
        for (const restaurant of restaurants) {
          const sampleQRCodes = [
            {
              name: "Table 1",
              type: "table",
              table_number: "1",
              description: "Main dining area",
              is_active: true
            },
            {
              name: "Table 2",
              type: "table",
              table_number: "2",
              description: "Main dining area",
              is_active: true
            },
            {
              name: "Takeaway Counter",
              type: "takeaway",
              description: "Pickup counter",
              is_active: true
            },
            {
              name: "Delivery Zone A",
              type: "delivery",
              description: "Local delivery area",
              is_active: true
            }
          ];

          for (const qrCode of sampleQRCodes) {
            const code = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const url = `${window.location.origin}/menu?qr=${code}`;
            
            await supabase
              .from('qr_codes')
              .insert({
                ...qrCode,
                restaurant_id: restaurant.id,
                code,
                url,
                scan_count: Math.floor(Math.random() * 50)
              });
          }
        }
      }
    }

    // Create sample reviews
    const { data: existingReviews } = await supabase
      .from('reviews')
      .select('id')
      .limit(1);

    if (!existingReviews || existingReviews.length === 0) {
      console.log("Creating sample reviews...");
      
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('id');

      if (restaurants) {
        for (const restaurant of restaurants) {
          const sampleReviews = [
            {
              customer_name: "John Smith",
              customer_email: "john.smith@email.com",
              rating: 5,
              comment: "Amazing food and great service! Will definitely come back.",
              is_approved: true
            },
            {
              customer_name: "Sarah Johnson",
              customer_email: "sarah.johnson@email.com",
              rating: 4,
              comment: "Delicious food, friendly staff. Highly recommend!",
              is_approved: true
            },
            {
              customer_name: "Mike Davis",
              customer_email: "mike.davis@email.com",
              rating: 5,
              comment: "Best restaurant in town! The food is incredible.",
              is_approved: true
            },
            {
              customer_name: "Lisa Wilson",
              customer_email: "lisa.wilson@email.com",
              rating: 4,
              comment: "Great atmosphere and wonderful food. Perfect for date night.",
              is_approved: false
            }
          ];

          for (const review of sampleReviews) {
            await supabase
              .from('reviews')
              .insert({
                ...review,
                restaurant_id: restaurant.id
              });
          }
        }
      }
    }

    console.log("Database setup completed successfully!");
    return { success: true, message: "Database setup completed successfully!" };
  } catch (error) {
    console.error("Error setting up database:", error);
    throw new Error(`Database setup failed: ${error.message}`);
  }
} 