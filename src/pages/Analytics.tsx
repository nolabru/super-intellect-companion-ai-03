
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import MediaAnalyticsDashboard from '@/components/analytics/MediaAnalyticsDashboard';

const Analytics = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Media Analytics</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <MediaAnalyticsDashboard />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Analytics;
