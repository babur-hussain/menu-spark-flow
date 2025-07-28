import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { QrCode, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_ADMIN_CREDENTIALS, DEFAULT_RESTAURANT_CREDENTIALS, authService } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["restaurant_manager", "super_admin"]),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "restaurant_manager",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      const result = await login(data);
      
      if (result.success) {
        toast({
          title: "Login Successful",
          description: `Welcome back! Redirecting to your ${data.role === "super_admin" ? "super admin" : "restaurant"} dashboard.`,
        });
        
        // Redirect based on role
        if (data.role === "super_admin") {
          navigate("/admin/overview");
        } else {
          navigate("/admin/dashboard");
        }
      } else {
        // Handle specific error cases
        if (result.error?.includes('Email not confirmed')) {
          toast({
            title: "Email Not Confirmed",
            description: result.error,
            variant: "destructive",
          });
          
          // Show additional options for email confirmation
          setTimeout(() => {
            toast({
              title: "Need Help?",
              description: "Try using the demo credentials below, or check your email for a confirmation link.",
              variant: "default",
            });
          }, 2000);
        } else {
          toast({
            title: "Login Failed",
            description: result.error || "Invalid credentials. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <QrCode className="h-12 w-12 text-primary mr-3" />
            <span className="text-3xl font-bold text-gradient">MenuMaster</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Login</h1>
          <p className="text-muted-foreground">Access your restaurant management dashboard</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="restaurant_manager">Restaurant Manager</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="admin@restaurant.com" 
                          autoComplete="email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password" 
                            autoComplete="current-password"
                            {...field} 
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/admin/register" className="text-primary hover:underline">
                  Register here
                </Link>
              </p>
              <Button 
                variant="link" 
                onClick={() => navigate("/")}
                className="text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Website
              </Button>
            </div>
            
            {/* Email Confirmation Help */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                Having trouble with email confirmation?
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  const email = form.getValues('email');
                  if (email) {
                    const result = await authService.resendConfirmationEmail(email);
                    if (result.success) {
                      toast({
                        title: "Confirmation Email Sent",
                        description: "Please check your email and click the confirmation link.",
                      });
                    } else {
                      toast({
                        title: "Failed to Send Email",
                        description: result.error || "Please try again later.",
                        variant: "destructive",
                      });
                    }
                  } else {
                    toast({
                      title: "Email Required",
                      description: "Please enter your email address first.",
                      variant: "destructive",
                    });
                  }
                }}
                className="w-full mb-2"
              >
                Resend Confirmation Email
              </Button>
              
              {/* Development Bypass (only show in development) */}
              {process.env.NODE_ENV === 'development' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    const email = form.getValues('email');
                    const password = form.getValues('password');
                    if (email && password) {
                      const result = await authService.bypassEmailConfirmation(email, password);
                      if (result.success) {
                        toast({
                          title: "Development Login Successful",
                          description: "Email confirmation bypassed for development.",
                        });
                        // Redirect based on role
                        const role = form.getValues('role');
                        if (role === "super_admin") {
                          navigate("/admin/overview");
                        } else {
                          navigate("/admin/dashboard");
                        }
                      } else {
                        toast({
                          title: "Development Login Failed",
                          description: result.error || "Please check your credentials.",
                          variant: "destructive",
                        });
                      }
                    } else {
                      toast({
                        title: "Credentials Required",
                        description: "Please enter both email and password.",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="w-full"
                >
                  🚀 Development: Bypass Email Confirmation
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Demo Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="font-medium">Restaurant Manager:</p>
              <p className="text-muted-foreground">
                {DEFAULT_RESTAURANT_CREDENTIALS.email} / {DEFAULT_RESTAURANT_CREDENTIALS.password}
              </p>
            </div>
            <div>
              <p className="font-medium">Super Admin:</p>
              <p className="text-muted-foreground">
                {DEFAULT_ADMIN_CREDENTIALS.email} / {DEFAULT_ADMIN_CREDENTIALS.password}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}