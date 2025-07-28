import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RestaurantDashboard from './RestaurantDashboard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

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
                Your account is not associated with any restaurant. Please contact the administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return <RestaurantDashboard restaurantId={user.restaurant_id} />;
} 