import { supabase } from "@/integrations/supabase/client";

export const insertSampleData = async () => {
  try {
    console.log('Inserting sample data...');

    // Insert sample restaurants
    const sampleRestaurants = [
      {
        name: "Bella Vista Restaurant",
        description: "Authentic Italian cuisine in the heart of downtown",
        address: "123 Main St, New York, NY 10001",
        phone: "+1-555-123-4567",
        email: "info@bellavista.com",
        website: "https://bellavista.com",
        is_active: true,
        user_id: "00000000-0000-0000-0000-000000000002" // Default manager user
      },
      {
        name: "Golden Dragon",
        description: "Traditional Chinese cuisine with modern twists",
        address: "456 Oak Ave, San Francisco, CA 94102",
        phone: "+1-555-234-5678",
        email: "contact@goldendragon.com",
        website: "https://goldendragon.com",
        is_active: true,
        user_id: "00000000-0000-0000-0000-000000000002"
      },
      {
        name: "Ocean Breeze Cafe",
        description: "Fresh seafood and coastal cuisine",
        address: "789 Beach Blvd, Miami, FL 33101",
        phone: "+1-555-345-6789",
        email: "hello@oceanbreeze.com",
        website: "https://oceanbreeze.com",
        is_active: true,
        user_id: "00000000-0000-0000-0000-000000000002"
      },
      {
        name: "Mountain View Bistro",
        description: "Farm-to-table dining with mountain views",
        address: "321 Pine St, Denver, CO 80201",
        phone: "+1-555-456-7890",
        email: "info@mountainview.com",
        website: "https://mountainview.com",
        is_active: true,
        user_id: "00000000-0000-0000-0000-000000000002"
      }
    ];

    for (const restaurant of sampleRestaurants) {
      // Check if restaurant already exists
      const { data: existingRestaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('name', restaurant.name)
        .single();

      if (existingRestaurant) {
        console.log(`Restaurant ${restaurant.name} already exists, skipping...`);
        continue;
      }

      const { data, error } = await supabase
        .from('restaurants')
        .insert(restaurant)
        .select();

      if (error) {
        console.error('Error inserting restaurant:', error);
        continue;
      }

      const restaurantId = data?.[0]?.id;
      if (!restaurantId) continue;

      // Insert sample orders for each restaurant
      const sampleOrders = generateSampleOrders(restaurantId);
      
      for (const order of sampleOrders) {
        const { error: orderError } = await supabase
          .from('orders')
          .insert(order);

        if (orderError) {
          console.error('Error inserting order:', orderError);
        }
      }

      console.log(`Inserted data for ${restaurant.name}`);
    }

    console.log('Sample data insertion completed!');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
};

const generateSampleOrders = (restaurantId: string) => {
  const orders = [];
  const now = new Date();
  
  // Generate orders for the last 6 months
  for (let i = 0; i < 30; i++) {
    const orderDate = new Date(now.getTime() - Math.random() * 180 * 24 * 60 * 60 * 1000);
    const totalAmount = Math.round((Math.random() * 100 + 20) * 100) / 100; // $20-$120
    
    orders.push({
      restaurant_id: restaurantId,
      customer_name: `Customer ${i + 1}`,
      customer_email: `customer${i + 1}@example.com`,
      customer_phone: `+1-555-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      order_type: Math.random() > 0.5 ? 'dine_in' : 'takeaway',
      status: ['pending', 'confirmed', 'preparing', 'ready', 'completed'][Math.floor(Math.random() * 5)],
      total_amount: totalAmount,
      notes: Math.random() > 0.7 ? 'Special instructions' : null,
      created_at: orderDate.toISOString(),
      updated_at: orderDate.toISOString()
    });
  }
  
  return orders;
};

// Function to be called from the browser console for testing
export const populateSampleData = () => {
  insertSampleData().then(() => {
    console.log('Sample data populated successfully!');
    window.location.reload(); // Reload the page to see the new data
  });
}; 