import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RestaurantDashboard from './RestaurantDashboard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function RestaurantDashboardWrapper() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AdminLayout userRole="restaurant_manager">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout userRole="restaurant_manager">
        <div className="flex items-center justify-center h-64">
          <Card className="max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <h2 className="text-lg font-semibold">Authentication Required</h2>
              </div>
              <p className="text-muted-foreground">
                Please log in to access the restaurant dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const [creating, setCreating] = useState(false);

  const handleCreateRestaurant = async () => {
    try {
      setCreating(true);
      const name = (user as any)?.preferred_restaurant_name || user.email.split('@')[0] + "'s Restaurant";
      const email = user.email;
      const { data, error } = await supabase
        .from('restaurants')
        .insert({
          user_id: user.id,
          name,
          email,
          is_active: true,
        })
        .select('id')
        .single();

      if (!error && data?.id) {
        await supabase
          .from('user_profiles')
          .update({ restaurant_id: data.id })
          .eq('id', user.id);
        // Hard refresh to reload context
        window.location.reload();
      }
    } finally {
      setCreating(false);
    }
  };

  if (!user.restaurant_id) {
    return (
      <AdminLayout userRole="restaurant_manager">
        <div className="flex items-center justify-center h-64">
          <Card className="max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-orange-500" />
                <h2 className="text-lg font-semibold">No Restaurant Assigned</h2>
              </div>
              <p className="text-muted-foreground">
                Your account is not associated with any restaurant.
              </p>
              <div className="mt-4 flex gap-2">
                <Button onClick={handleCreateRestaurant} disabled={creating}>
                  {creating ? 'Creating…' : 'Create My Restaurant'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return <RestaurantDashboard restaurantId={user.restaurant_id} />;
} 