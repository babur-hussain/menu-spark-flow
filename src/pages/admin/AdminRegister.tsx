import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { QrCode, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/auth";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  restaurant_name: z.string().min(2, "Restaurant name must be at least 2 characters"),
  restaurant_description: z.string().optional(),
  restaurant_address: z.string().min(5, "Address must be at least 5 characters"),
  restaurant_phone: z.string().min(10, "Phone number must be at least 10 characters"),
  restaurant_email: z.string().email("Invalid restaurant email address"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function AdminRegister() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    isValid: boolean;
    errors: string[];
  }>({ isValid: false, errors: [] });

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      restaurant_name: "",
      restaurant_description: "",
      restaurant_address: "",
      restaurant_phone: "",
      restaurant_email: "",
    },
  });

  const handlePasswordChange = (password: string) => {
    const validation = authService.validatePassword(password);
    setPasswordStrength(validation);
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (!passwordStrength.isValid) {
      toast({
        title: "Password Requirements",
        description: "Please ensure your password meets all security requirements.",
        variant: "destructive",
      });
      return;
    }

    // Prevent rapid-fire submissions
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Add a small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await register(data);
      
      if (result.success) {
        toast({
          title: "Registration Successful",
          description: "Your account has been created successfully. Please check your email to confirm your account before logging in.",
        });
        
        // Show additional guidance
        setTimeout(() => {
          toast({
            title: "Email Confirmation Required",
            description: "You'll receive a confirmation email shortly. Click the link in the email to activate your account.",
            variant: "default",
          });
        }, 2000);
        
        // Redirect to login page instead of dashboard
        navigate("/admin/login");
      } else {
        toast({
          title: "Registration Failed",
          description: result.error || "An error occurred during registration.",
          variant: "destructive",
        });
        
        // If it's a rate limiting error, show additional guidance
        if (result.error?.includes('Too many registration attempts')) {
          setTimeout(() => {
            toast({
              title: "Rate Limiting",
              description: "You can try again in a few minutes, or use the demo credentials to explore the system.",
              variant: "default",
            });
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <QrCode className="h-12 w-12 text-primary mr-3" />
            <span className="text-3xl font-bold text-gradient">MenuMaster</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Restaurant Registration</h1>
          <p className="text-muted-foreground">Create your restaurant account and start managing your menu</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Register your restaurant and start managing your digital menu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Account Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Account Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="manager@yourrestaurant.com" 
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
                              placeholder="Create a strong password" 
                              autoComplete="new-password"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handlePasswordChange(e.target.value);
                              }}
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

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password" 
                              autoComplete="new-password"
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
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

                  {/* Password Strength Indicator */}
                  {form.watch("password") && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Password Requirements</Label>
                      <div className="space-y-1">
                        {passwordStrength.errors.map((error, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <span className="text-destructive">{error}</span>
                          </div>
                        ))}
                        {passwordStrength.isValid && (
                          <div className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">Password meets all requirements</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Restaurant Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Restaurant Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="restaurant_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restaurant Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your Restaurant Name" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="restaurant_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Brief description of your restaurant" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="restaurant_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Restaurant address" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="restaurant_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+1 (555) 123-4567" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="restaurant_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restaurant Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="contact@yourrestaurant.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !passwordStrength.isValid}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/admin/login" className="text-primary hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Button 
            variant="link" 
            onClick={() => navigate("/")}
            className="text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Website
          </Button>
        </div>
      </div>
    </div>
  );
} 