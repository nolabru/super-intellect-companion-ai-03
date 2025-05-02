
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import MediaAnalyticsDashboard from '@/components/analytics/MediaAnalyticsDashboard';
import MainLayout from '@/components/layout/MainLayout';
import ChatSidebar from '@/components/layout/ChatSidebar';
import { useIsMobile } from '@/hooks/use-mobile';

const Analytics = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <MainLayout 
      sidebarOpen={sidebarOpen}
      onToggleSidebar={toggleSidebar}
      isTouchDevice={isMobile}
      title="Media Analytics"
    >
      <div className="flex h-full">
        <ChatSidebar 
          sidebarOpen={sidebarOpen} 
          onToggleSidebar={toggleSidebar} 
          isMobile={isMobile} 
        />
        
        <div className="flex-1 overflow-y-auto">
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <Card>
              <CardContent className="pt-6">
                <MediaAnalyticsDashboard />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </MainLayout>
  );
};

export default Analytics;
