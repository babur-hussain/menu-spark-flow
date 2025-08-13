import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ExternalLink, FileText, Settings } from "lucide-react";

const SetupRequired: React.FC = () => {
  const openSupabaseDashboard = () => {
    window.open('https://supabase.com/dashboard', '_blank');
  };

  const openEnvironmentSetup = () => {
    // Try to open the ENVIRONMENT_SETUP.md file
    window.open('/ENVIRONMENT_SETUP.md', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Setup Required</h1>
          <p className="text-muted-foreground text-lg">
            Your application needs Supabase configuration to run
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Missing Environment Variables
            </CardTitle>
            <CardDescription>
              The application cannot connect to Supabase without the required environment variables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Error:</strong> Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for production.
              </p>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold">Required Environment Variables:</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-muted rounded text-sm">VITE_SUPABASE_URL</code>
                  <span className="text-muted-foreground">Your Supabase project URL</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-muted rounded text-sm">VITE_SUPABASE_ANON_KEY</code>
                  <span className="text-muted-foreground">Your Supabase anonymous key</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quick Setup Steps
            </CardTitle>
            <CardDescription>
              Follow these steps to get your application running
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium">Create .env file</p>
                  <p className="text-sm text-muted-foreground">Create a .env file in your project root directory</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium">Get Supabase credentials</p>
                  <p className="text-sm text-muted-foreground">Visit your Supabase dashboard to get your project URL and API key</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-medium">Add to .env file</p>
                  <p className="text-sm text-muted-foreground">Add your credentials to the .env file and restart the server</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={openSupabaseDashboard}
            className="flex items-center gap-2"
            variant="outline"
          >
            <ExternalLink className="h-4 w-4" />
            Open Supabase Dashboard
          </Button>
          
          <Button 
            onClick={openEnvironmentSetup}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            View Setup Guide
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Check the <code className="px-1 py-0.5 bg-muted rounded text-xs">ENVIRONMENT_SETUP.md</code> file for detailed instructions
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupRequired;
