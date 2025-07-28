import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Settings as SettingsIcon,
  Building2,
  Clock,
  DollarSign,
  Bell,
  Shield,
  Palette,
  Globe,
  CreditCard,
  Users,
  QrCode,
  FileText,
  Save,
  Upload,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Key,
  Mail,
  Phone,
  MapPin,
  Globe2,
  Calendar,
  AlertTriangle,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LogoutButton } from "@/components/auth/LogoutButton";

const restaurantSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  description: z.string().min(1, "Description is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip_code: z.string().min(1, "ZIP code is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Valid email is required"),
  website: z.string().url("Valid website URL is required").optional().or(z.literal("")),
  cuisine_type: z.string().min(1, "Cuisine type is required"),
  price_range: z.enum(["$", "$$", "$$$", "$$$$"]),
  capacity: z.string().min(1, "Capacity is required"),
});

const hoursSchema = z.object({
  monday_open: z.string(),
  monday_close: z.string(),
  tuesday_open: z.string(),
  tuesday_close: z.string(),
  wednesday_open: z.string(),
  wednesday_close: z.string(),
  thursday_open: z.string(),
  thursday_close: z.string(),
  friday_open: z.string(),
  friday_close: z.string(),
  saturday_open: z.string(),
  saturday_close: z.string(),
  sunday_open: z.string(),
  sunday_close: z.string(),
});

const notificationSchema = z.object({
  email_notifications: z.boolean(),
  sms_notifications: z.boolean(),
  push_notifications: z.boolean(),
  order_alerts: z.boolean(),
  review_alerts: z.boolean(),
  system_alerts: z.boolean(),
  marketing_emails: z.boolean(),
});

type RestaurantFormData = z.infer<typeof restaurantSchema>;
type HoursFormData = z.infer<typeof hoursSchema>;
type NotificationFormData = z.infer<typeof notificationSchema>;

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [showPassword, setShowPassword] = useState(false);

  const restaurantForm = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      name: "Radisson Blu Restaurant",
      description: "An upscale dining experience offering contemporary cuisine in a sophisticated atmosphere.",
      address: "123 Main Street",
      city: "New York",
      state: "NY",
      zip_code: "10001",
      phone: "+1 (555) 123-4567",
      email: "info@radissonblu.com",
      website: "https://www.radissonblu.com",
      cuisine_type: "Contemporary American",
      price_range: "$$$",
      capacity: "120",
    },
  });

  const hoursForm = useForm<HoursFormData>({
    resolver: zodResolver(hoursSchema),
    defaultValues: {
      monday_open: "11:00",
      monday_close: "22:00",
      tuesday_open: "11:00",
      tuesday_close: "22:00",
      wednesday_open: "11:00",
      wednesday_close: "22:00",
      thursday_open: "11:00",
      thursday_close: "23:00",
      friday_open: "11:00",
      friday_close: "23:00",
      saturday_open: "10:00",
      saturday_close: "23:00",
      sunday_open: "10:00",
      sunday_close: "21:00",
    },
  });

  const notificationForm = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      order_alerts: true,
      review_alerts: true,
      system_alerts: true,
      marketing_emails: false,
    },
  });

  const onSubmitRestaurant = async (data: RestaurantFormData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Settings Updated",
        description: "Restaurant information has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update restaurant information.",
        variant: "destructive",
      });
    }
  };

  const onSubmitHours = async (data: HoursFormData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Hours Updated",
        description: "Operating hours have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update operating hours.",
        variant: "destructive",
      });
    }
  };

  const onSubmitNotifications = async (data: NotificationFormData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Notifications Updated",
        description: "Notification preferences have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification preferences.",
        variant: "destructive",
      });
    }
  };

  const days = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  return (
    <AdminLayout userRole="restaurant_manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your restaurant's configuration and preferences
            </p>
          </div>
          <LogoutButton variant="outline" />
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="hours">Hours</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Restaurant Information
                </CardTitle>
                <CardDescription>
                  Update your restaurant's basic information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...restaurantForm}>
                  <form onSubmit={restaurantForm.handleSubmit(onSubmitRestaurant)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={restaurantForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Restaurant Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Restaurant Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={restaurantForm.control}
                        name="cuisine_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cuisine Type</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Italian, American, Asian" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={restaurantForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your restaurant's concept, atmosphere, and specialties..."
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={restaurantForm.control}
                        name="price_range"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price Range</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select price range" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="$">$ (Under $15)</SelectItem>
                                <SelectItem value="$$">$$ ($15-$30)</SelectItem>
                                <SelectItem value="$$$">$$$ ($31-$60)</SelectItem>
                                <SelectItem value="$$$$">$$$$ (Over $60)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={restaurantForm.control}
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seating Capacity</FormLabel>
                            <FormControl>
                              <Input placeholder="120" type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={restaurantForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={restaurantForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="info@restaurant.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={restaurantForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://www.restaurant.com" type="url" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={restaurantForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main Street" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={restaurantForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="New York" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={restaurantForm.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input placeholder="NY" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={restaurantForm.control}
                          name="zip_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input placeholder="10001" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Operating Hours */}
          <TabsContent value="hours" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Operating Hours
                </CardTitle>
                <CardDescription>
                  Set your restaurant's operating hours for each day of the week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...hoursForm}>
                  <form onSubmit={hoursForm.handleSubmit(onSubmitHours)} className="space-y-4">
                    <div className="space-y-4">
                      {days.map((day) => (
                        <div key={day.key} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="w-24">
                            <Label className="font-medium">{day.label}</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <FormField
                              control={hoursForm.control}
                              name={`${day.key}_open` as keyof HoursFormData}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <span className="text-muted-foreground">to</span>
                            <FormField
                              control={hoursForm.control}
                              name={`${day.key}_close` as keyof HoursFormData}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit">
                        <Save className="w-4 h-4 mr-2" />
                        Save Hours
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(onSubmitNotifications)} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Notification Channels</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">Email Notifications</div>
                            <div className="text-sm text-muted-foreground">
                              Receive notifications via email
                            </div>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="email_notifications"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">SMS Notifications</div>
                            <div className="text-sm text-muted-foreground">
                              Receive notifications via text message
                            </div>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="sms_notifications"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">Push Notifications</div>
                            <div className="text-sm text-muted-foreground">
                              Receive notifications in the app
                            </div>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="push_notifications"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Notification Types</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">Order Alerts</div>
                            <div className="text-sm text-muted-foreground">
                              Notify when new orders are received
                            </div>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="order_alerts"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">Review Alerts</div>
                            <div className="text-sm text-muted-foreground">
                              Notify when new reviews are posted
                            </div>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="review_alerts"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">System Alerts</div>
                            <div className="text-sm text-muted-foreground">
                              Important system updates and maintenance
                            </div>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="system_alerts"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">Marketing Emails</div>
                            <div className="text-sm text-muted-foreground">
                              Receive promotional and marketing content
                            </div>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="marketing_emails"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit">
                        <Save className="w-4 h-4 mr-2" />
                        Save Preferences
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <Button>
                      <Key className="w-4 h-4 mr-2" />
                      Update Password
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Enable 2FA</div>
                      <div className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </div>
                    </div>
                    <Button variant="outline">Setup 2FA</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Login Sessions</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Current Session</div>
                        <div className="text-sm text-muted-foreground">
                          macOS • Chrome • New York, NY
                        </div>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Previous Session</div>
                        <div className="text-sm text-muted-foreground">
                          iPhone • Safari • New York, NY
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Revoke</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe2 className="h-5 w-5" />
                  Integrations
                </CardTitle>
                <CardDescription>
                  Connect with third-party services and platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Payment Processors</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-8 w-8 text-blue-600" />
                        <div>
                          <div className="font-medium">Stripe</div>
                          <div className="text-sm text-muted-foreground">
                            Process credit card payments
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-8 w-8 text-green-600" />
                        <div>
                          <div className="font-medium">PayPal</div>
                          <div className="text-sm text-muted-foreground">
                            Accept PayPal payments
                          </div>
                        </div>
                      </div>
                      <Button variant="outline">Connect</Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Delivery Services</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-red-600" />
                        <div>
                          <div className="font-medium">Uber Eats</div>
                          <div className="text-sm text-muted-foreground">
                            Food delivery service
                          </div>
                        </div>
                      </div>
                      <Button variant="outline">Connect</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-green-600" />
                        <div>
                          <div className="font-medium">DoorDash</div>
                          <div className="text-sm text-muted-foreground">
                            Food delivery service
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Analytics & Marketing</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-8 w-8 text-blue-600" />
                        <div>
                          <div className="font-medium">Google Analytics</div>
                          <div className="text-sm text-muted-foreground">
                            Track website traffic and user behavior
                          </div>
                        </div>
                      </div>
                      <Button variant="outline">Connect</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-8 w-8 text-purple-600" />
                        <div>
                          <div className="font-medium">Mailchimp</div>
                          <div className="text-sm text-muted-foreground">
                            Email marketing campaigns
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
} 