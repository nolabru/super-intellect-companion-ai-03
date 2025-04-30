
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

interface ApiframeConfigProps {
  onConfigChange?: (isConfigured: boolean) => void;
}

const ApiframeConfig: React.FC<ApiframeConfigProps> = ({ onConfigChange }) => {
  // Automatically trigger the onConfigChange callback with true
  React.useEffect(() => {
    if (onConfigChange) {
      onConfigChange(true);
    }
  }, [onConfigChange]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>APIframe Configuration</span>
        </CardTitle>
        <CardDescription>
          APIframe API key is globally configured for all users
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Alert className="bg-green-500/10 border-green-500/50">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>Global API Key Configured</AlertTitle>
          <AlertDescription>
            The APIframe API key is globally configured on the server. No additional setup is required.
            You can start using APIframe services immediately.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default ApiframeConfig;
