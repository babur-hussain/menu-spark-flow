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

  const handleResendConfirmation = async () => {
    const email = form.getValues("email");
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await authService.resendConfirmationEmail(email);
      toast({
        title: "Confirmation Email Sent",
        description: "Please check your email for the confirmation link.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send confirmation email. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBypassEmailConfirmation = async () => {
    const email = form.getValues("email");
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await authService.bypassEmailConfirmation(email);
      toast({
        title: "Email Confirmation Bypassed",
        description: "You can now log in with your credentials.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to bypass email confirmation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDemoLogin = (role: "restaurant_manager" | "super_admin") => {
    const credentials = role === "super_admin" ? DEFAULT_ADMIN_CREDENTIALS : DEFAULT_RESTAURANT_CREDENTIALS;
    form.setValue("email", credentials.email);
    form.setValue("password", credentials.password);
    form.setValue("role", role);
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
                          placeholder="Enter your email" 
                          {...field}
                          autoComplete="email"
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
                            {...field}
                            autoComplete="current-password"
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

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="text-sm font-medium mb-3">Demo Credentials</h3>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDemoLogin("restaurant_manager")}
                >
                  Restaurant Manager Demo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDemoLogin("super_admin")}
                >
                  Super Admin Demo
                </Button>
              </div>
            </div>

            {/* Email Confirmation Help */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium mb-2">Email Confirmation Issues?</h3>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleResendConfirmation}
                >
                  Resend Confirmation Email
                </Button>
                {process.env.NODE_ENV === 'development' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleBypassEmailConfirmation}
                  >
                    Development: Bypass Email Confirmation
                  </Button>
                )}
              </div>
            </div>

            {/* Links */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/admin/register" className="text-primary hover:underline">
                  Register here
                </Link>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <Link to="/" className="text-primary hover:underline flex items-center justify-center gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  Back to home
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}