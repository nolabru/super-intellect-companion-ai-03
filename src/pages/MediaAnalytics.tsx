
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import MediaAnalyticsDashboard from '@/components/analytics/MediaAnalyticsDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const MediaAnalytics: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Handle unauthorized access
  if (!user) {
    return (
      <Layout>
        <div className="container py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Authentication Required
              </CardTitle>
              <CardDescription>
                You need to be logged in to access the media analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Media Analytics</h1>
        
        <MediaAnalyticsDashboard 
          userId={user?.id} 
          className="mb-8"
        />
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy Information
            </CardTitle>
            <CardDescription>
              How we collect and use analytics data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The analytics shown on this page are based on your media generation activity.
              We collect information about the types of media you generate, which models you use,
              and performance metrics to help improve the service and provide you with insights.
              This data is only visible to you and our administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MediaAnalytics;
