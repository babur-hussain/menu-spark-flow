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

    let restaurantId: string | null = null;

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
        const { data: newRestaurant, error } = await supabase
          .from('restaurants')
          .insert(restaurant)
          .select()
          .single();
        
        if (error) {
          console.log("Error creating restaurant:", error);
        } else {
          console.log("Created restaurant:", restaurant.name);
          // Use the first restaurant as the primary one
          if (!restaurantId) {
            restaurantId = newRestaurant.id;
          }
        }
      }
    } else {
      console.log("Restaurants already exist, skipping creation");
      // Get the first existing restaurant
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('id')
        .limit(1);
      
      if (restaurants && restaurants.length > 0) {
        restaurantId = restaurants[0].id;
      }
    }

    // Update user profile with restaurant_id if we have one
    if (restaurantId && currentUserId !== "00000000-0000-0000-0000-000000000000") {
      console.log("Updating user profile with restaurant_id:", restaurantId);
      
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ restaurant_id: restaurantId })
        .eq('id', currentUserId);
      
      if (updateError) {
        console.log("Error updating user profile:", updateError);
      } else {
        console.log("Successfully updated user profile with restaurant_id");
      }
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
        }, {} as Record<string, { id: string; name: string; restaurant_id: string }[]>);

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

    // Create sample orders if they don't exist
    const { data: existingOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    if (ordersError) {
      console.log("Error checking existing orders:", ordersError);
    }

    if (!existingOrders || existingOrders.length === 0) {
      console.log("Creating sample orders...");
      
      // Get restaurant ID for orders
      if (restaurantId) {
        const sampleOrders = [
          {
            restaurant_id: restaurantId,
            customer_name: "John Smith",
            customer_email: "john@example.com",
            customer_phone: "+1-555-123-4567",
            order_type: "dine_in",
            status: "completed",
            total_amount: 45.97,
            table_number: "1",
            notes: "Extra napkins please"
          },
          {
            restaurant_id: restaurantId,
            customer_name: "Sarah Johnson",
            customer_email: "sarah@example.com",
            customer_phone: "+1-555-234-5678",
            order_type: "takeaway",
            status: "ready",
            total_amount: 32.50,
            notes: "No onions"
          },
          {
            restaurant_id: restaurantId,
            customer_name: "Mike Davis",
            customer_email: "mike@example.com",
            customer_phone: "+1-555-345-6789",
            order_type: "dine_in",
            status: "preparing",
            total_amount: 28.75,
            table_number: "3",
            notes: "Well done steak"
          },
          {
            restaurant_id: restaurantId,
            customer_name: "Lisa Wilson",
            customer_email: "lisa@example.com",
            customer_phone: "+1-555-456-7890",
            order_type: "delivery",
            status: "confirmed",
            total_amount: 67.25,
            delivery_address: "123 Main St, City, State 12345",
            notes: "Ring doorbell twice"
          }
        ];

        for (const order of sampleOrders) {
          const { error } = await supabase
            .from('orders')
            .insert(order);
          
          if (error) {
            console.log("Error creating order:", error);
          } else {
            console.log("Created order for:", order.customer_name);
          }
        }
      }
    } else {
      console.log("Orders already exist, skipping creation");
    }

    // Create sample QR codes if they don't exist
    const { data: existingQRCodes, error: qrCodesError } = await supabase
      .from('qr_codes')
      .select('id')
      .limit(1);

    if (qrCodesError) {
      console.log("Error checking existing QR codes:", qrCodesError);
    }

    if (!existingQRCodes || existingQRCodes.length === 0) {
      console.log("Creating sample QR codes...");
      
      // Get restaurant ID for QR codes
      if (restaurantId) {
        const sampleQRCodes = [
          {
            restaurant_id: restaurantId,
            name: "Table 1",
            type: "table",
            code: "QR-1701080000000-abc123def",
            url: "http://localhost:8082/menu?qr=QR-1701080000000-abc123def",
            table_number: "1",
            description: "Main dining area",
            is_active: true,
            scan_count: 25
          },
          {
            restaurant_id: restaurantId,
            name: "Table 2",
            type: "table",
            code: "QR-1701080000001-xyz789ghi",
            url: "http://localhost:8082/menu?qr=QR-1701080000001-xyz789ghi",
            table_number: "2",
            description: "Main dining area",
            is_active: true,
            scan_count: 18
          },
          {
            restaurant_id: restaurantId,
            name: "Takeaway Counter",
            type: "takeaway",
            code: "QR-1701080000002-mno456pqr",
            url: "http://localhost:8082/menu?qr=QR-1701080000002-mno456pqr",
            description: "Pickup counter",
            is_active: true,
            scan_count: 42
          },
          {
            restaurant_id: restaurantId,
            name: "Delivery Zone A",
            type: "delivery",
            code: "QR-1701080000003-stu123vwx",
            url: "http://localhost:8082/menu?qr=QR-1701080000003-stu123vwx",
            description: "Local delivery area",
            is_active: true,
            scan_count: 15
          }
        ];

        for (const qrCode of sampleQRCodes) {
          const { error } = await supabase
            .from('qr_codes')
            .insert(qrCode);
          
          if (error) {
            console.log("Error creating QR code:", error);
          } else {
            console.log("Created QR code:", qrCode.name);
          }
        }
      }
    } else {
      console.log("QR codes already exist, skipping creation");
    }

    // Create sample reviews if they don't exist
    const { data: existingReviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id')
      .limit(1);

    if (reviewsError) {
      console.log("Error checking existing reviews:", reviewsError);
    }

    if (!existingReviews || existingReviews.length === 0) {
      console.log("Creating sample reviews...");
      
      // Get restaurant ID for reviews
      if (restaurantId) {
        const sampleReviews = [
          {
            restaurant_id: restaurantId,
            customer_name: "John Smith",
            customer_email: "john.smith@email.com",
            rating: 5,
            comment: "Amazing food and great service! Will definitely come back.",
            is_approved: true
          },
          {
            restaurant_id: restaurantId,
            customer_name: "Sarah Johnson",
            customer_email: "sarah.johnson@email.com",
            rating: 4,
            comment: "Delicious food, friendly staff. Highly recommend!",
            is_approved: true
          },
          {
            restaurant_id: restaurantId,
            customer_name: "Mike Davis",
            customer_email: "mike.davis@email.com",
            rating: 5,
            comment: "Best restaurant in town! The food is incredible.",
            is_approved: true
          },
          {
            restaurant_id: restaurantId,
            customer_name: "Lisa Wilson",
            customer_email: "lisa.wilson@email.com",
            rating: 4,
            comment: "Great atmosphere and wonderful food. Perfect for date night.",
            is_approved: false
          }
        ];

        for (const review of sampleReviews) {
          const { error } = await supabase
            .from('reviews')
            .insert(review);
          
          if (error) {
            console.log("Error creating review:", error);
          } else {
            console.log("Created review from:", review.customer_name);
          }
        }
      }
    } else {
      console.log("Reviews already exist, skipping creation");
    }

    // Create sample order items if they don't exist
    const { data: existingOrderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('id')
      .limit(1);

    if (orderItemsError) {
      console.log("Error checking existing order items:", orderItemsError);
    }

    if (!existingOrderItems || existingOrderItems.length === 0) {
      console.log("Creating sample order items...");
      
      // Get restaurant ID and orders for order items
      if (restaurantId) {
        const { data: orders } = await supabase
          .from('orders')
          .select('id')
          .eq('restaurant_id', restaurantId)
          .limit(4);

        const { data: menuItems } = await supabase
          .from('menu_items')
          .select('id, price')
          .eq('restaurant_id', restaurantId)
          .limit(4);

        if (orders && menuItems && orders.length > 0 && menuItems.length > 0) {
          const sampleOrderItems = [
            {
              order_id: orders[0].id,
              menu_item_id: menuItems[0].id,
              quantity: 1,
              unit_price: menuItems[0].price,
              total_price: menuItems[0].price,
              special_instructions: "Extra cheese"
            },
            {
              order_id: orders[1].id,
              menu_item_id: menuItems[1].id,
              quantity: 2,
              unit_price: menuItems[1].price,
              total_price: menuItems[1].price * 2,
              special_instructions: "No onions"
            },
            {
              order_id: orders[2].id,
              menu_item_id: menuItems[2].id,
              quantity: 1,
              unit_price: menuItems[2].price,
              total_price: menuItems[2].price,
              special_instructions: "Well done"
            },
            {
              order_id: orders[3].id,
              menu_item_id: menuItems[3].id,
              quantity: 2,
              unit_price: menuItems[3].price,
              total_price: menuItems[3].price * 2,
              special_instructions: "Extra sauce"
            }
          ];

          for (const orderItem of sampleOrderItems) {
            const { error } = await supabase
              .from('order_items')
              .insert(orderItem);
            
            if (error) {
              console.log("Error creating order item:", error);
            } else {
              console.log("Created order item with quantity:", orderItem.quantity);
            }
          }
        }
      }
    } else {
      console.log("Order items already exist, skipping creation");
    }

    console.log("Simple database setup completed successfully!");
    
    // Force refresh the current user profile to get the updated restaurant_id
    if (currentUserId !== "00000000-0000-0000-0000-000000000000") {
      console.log("Refreshing user profile...");
      try {
        // Trigger a page reload to refresh the user context
        // This ensures the restaurant_id is properly loaded
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.log("Error triggering page reload:", error);
      }
    }
    
    return { success: true, message: "Database setup completed successfully!" };
  } catch (error) {
    console.error("Error in simple database setup:", error);
    throw new Error(`Database setup failed: ${error.message}`);
  }
} 