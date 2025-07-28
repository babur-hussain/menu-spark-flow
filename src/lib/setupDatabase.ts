import { supabase } from "@/integrations/supabase/client";

export const setupUserProfilesTable = async () => {
  try {
    console.log('Setting up user_profiles table...');

    // Check if user_profiles table exists
    const { data: existingTable, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      // Table doesn't exist, create it
      console.log('Creating user_profiles table...');
      
      // Note: We can't create tables directly from the client due to RLS restrictions
      // This would need to be done through the Supabase dashboard or CLI
      console.log('Please create the user_profiles table manually in your Supabase dashboard:');
      console.log(`
        CREATE TABLE public.user_profiles (
          id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('restaurant_manager', 'super_admin')),
          restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          last_login TIMESTAMP WITH TIME ZONE,
          is_active BOOLEAN NOT NULL DEFAULT true
        );
      `);
      
      return { success: false, error: 'Table needs to be created manually' };
    }

    if (existingTable) {
      console.log('user_profiles table already exists');
      return { success: true };
    }

    return { success: true };
  } catch (error) {
    console.error('Error setting up user_profiles table:', error);
    return { success: false, error: 'Failed to setup table' };
  }
};

// Function to be called from browser console for manual setup
export const initializeDatabase = () => {
  setupUserProfilesTable().then((result) => {
    if (result.success) {
      console.log('Database setup completed successfully!');
    } else {
      console.log('Database setup failed:', result.error);
      console.log('Please create the user_profiles table manually in your Supabase dashboard.');
    }
  });
}; 