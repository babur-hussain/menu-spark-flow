import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";

interface EmailConfirmationHelpProps {
  email?: string;
  onClose?: () => void;
}

export function EmailConfirmationHelp({ email, onClose }: EmailConfirmationHelpProps) {
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);
    try {
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
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Mail className="h-5 w-5 text-blue-500" />
          <CardTitle>Email Confirmation Required</CardTitle>
        </div>
        <CardDescription>
          Your account has been created, but you need to confirm your email address before you can log in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Check Your Email</p>
              <p className="text-sm text-muted-foreground">
                We've sent a confirmation link to <strong>{email}</strong>
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Click the Confirmation Link</p>
              <p className="text-sm text-muted-foreground">
                Open the email and click the "Confirm Email" button or link
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Return to Login</p>
              <p className="text-sm text-muted-foreground">
                Once confirmed, you can log in with your credentials
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full"
            variant="outline"
          >
            {isResending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Resend Confirmation Email
              </>
            )}
          </Button>
          
          {onClose && (
            <Button 
              onClick={onClose}
              variant="ghost"
              className="w-full"
            >
              Back to Login
            </Button>
          )}
        </div>

        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Can't find the email?
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Check your spam folder or contact support if you need assistance.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 