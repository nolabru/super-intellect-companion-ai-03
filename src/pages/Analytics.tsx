
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import MediaAnalyticsDashboard from '@/components/analytics/MediaAnalyticsDashboard';
import MainLayout from '@/components/layout/MainLayout';
import ChatSidebar from '@/components/layout/ChatSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import ConversationSidebar from '@/components/ConversationSidebar';
import { cn } from '@/lib/utils';

const Analytics = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="flex min-h-screen w-full bg-inventu-darker">
      {!isMobile && (
        <div className={cn("fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300", 
          sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
          <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
        </div>
      )}

      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity" onClick={toggleSidebar}>
          <div className="fixed inset-y-0 left-0 z-40 w-64 transform bg-inventu-dark" onClick={e => e.stopPropagation()}>
            <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
          </div>
        </div>
      )}

      <div className={cn("flex min-h-screen w-full flex-col transition-all duration-300", 
        !isMobile && sidebarOpen && "pl-64")}>
        <MainLayout 
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
          isTouchDevice={isMobile}
          title="Media Analytics"
        >
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <Card>
              <CardContent className="pt-6">
                <MediaAnalyticsDashboard />
              </CardContent>
            </Card>
          </main>
        </MainLayout>
      </div>
    </div>
  );
};

export default Analytics;
