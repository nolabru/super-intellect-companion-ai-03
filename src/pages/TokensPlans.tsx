import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { tokenService } from '@/services/tokenService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Coins, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MainLayout from '@/components/layout/MainLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import ConversationSidebar from '@/components/ConversationSidebar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
const TokensPlans = () => {
  const [loading, setLoading] = useState(true);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const {
    user
  } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  const loadTokenInfo = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      // Clear cache if retrying
      if (retryCount > 0) {
        tokenService.clearBalanceCache();
      }
      const balance = await tokenService.getUserTokenBalance(user.id);
      setTokenInfo(balance);
      setError(null);

      // Show success toast if retrying was successful
      if (retryCount > 0) {
        toast.success('Token information refreshed successfully');
      }
    } catch (err) {
      console.error('Error loading token information:', err);
      setError('Error loading token information. Please try again later.');
      toast.error('Error loading token information');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadTokenInfo();
  }, [user, retryCount]);

  // Format reset date
  const formatResetDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    try {
      const resetDate = new Date(dateString);
      return format(resetDate, "d 'of' MMMM, yyyy", {
        locale: ptBR
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  // Calculate days until reset
  const getDaysUntilReset = () => {
    if (!tokenInfo?.nextResetDate) return null;
    return tokenService.getDaysUntilReset(tokenInfo.nextResetDate);
  };
  const handleRefresh = () => {
    setRetryCount(prev => prev + 1);
  };
  if (!user) {
    return <div className="flex min-h-screen w-full bg-inventu-darker">
        <MainLayout title="Token Management">
          <div className="container mx-auto px-4 py-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center">Please log in to view your tokens.</p>
              </CardContent>
            </Card>
          </div>
        </MainLayout>
      </div>;
  }
  return <div className="flex min-h-screen w-full bg-inventu-darker">
      {!isMobile && <div className={cn("fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
          <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
        </div>}

      {isMobile && sidebarOpen && <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity" onClick={toggleSidebar}>
          <div className="fixed inset-y-0 left-0 z-40 w-64 transform bg-inventu-dark" onClick={e => e.stopPropagation()}>
            <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
          </div>
        </div>}

      <div className={cn("flex min-h-screen w-full flex-col transition-all duration-300", !isMobile && sidebarOpen && "pl-64")}>
        <MainLayout sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} isTouchDevice={isMobile} title="Token Management">
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="container mx-auto px-0 py-0">
              <div className="flex justify-between items-center mb-3 px-0 py-0 my-0 mx-0">
                <h1 className="text-white text-xl font-medium">Token Management</h1>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="flex items-center gap-1">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Refresh
                </Button>
              </div>
              
              {loading ? <Card className="bg-inventu-dark border-inventu-gray/30">
                  <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-inventu-blue" />
                      <p className="mt-2">Loading token information...</p>
                    </div>
                  </CardContent>
                </Card> : error ? <Card className="bg-inventu-dark border-inventu-gray/30 border-red-500/50">
                  <CardContent className="pt-6">
                    <div className="text-center text-red-400">
                      <p>{error}</p>
                      <Button variant="outline" className="mt-4" onClick={handleRefresh}>
                        Retry
                      </Button>
                    </div>
                  </CardContent>
                </Card> : <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
                  <Card className="bg-inventu-dark border-inventu-gray/30 mx-0 my-0 px-[18px] py-[18px]">
                    <CardHeader className="px-0 py-0 mx-0 my-0">
                      <CardTitle className="text-lg">Current Balance</CardTitle>
                      <CardDescription className="text-stone-600">Your current token usage and balance</CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 py-0 mx-0 my-0">
                      <div className="mt-5">
                        <div className="flex items-center justify-between ">
                          <div className="flex items-center">
                            <Coins className="h-5 w-5 mr-2 text-inventu-blue" />
                            <span>Available Tokens</span>
                          </div>
                          <span className="text-xl font-bold">{tokenInfo?.tokensRemaining || 0}</span>
                        </div>
                        
                        <div className="flex items-center justify-between mx-0 px-0 my-0 py-0">
                          <div className="flex items-center">
                            <Clock className="h-5 w-5 mr-2 text-inventu-blue" />
                            <span>Next Reset</span>
                          </div>
                          <span>
                            {tokenInfo?.nextResetDate ? <>
                                {formatResetDate(tokenInfo.nextResetDate)}
                                {getDaysUntilReset() !== null && <span className="ml-2 text-sm text-stone-400">
                                    ({getDaysUntilReset()} days)
                                  </span>}
                              </> : 'Not scheduled'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-inventu-dark border-inventu-gray/30 mx-0 my-0 px-[18px] py-[18px]">
                    <CardHeader className="mx-0 my-0 px-0 py-0">
                      <CardTitle className="text-lg">Get More Tokens</CardTitle>
                      <CardDescription className="text-stone-600">Available plans and options</CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 mx-0 my-0 py-0">
                      <p className="mt-5">
                        Contact us for information about purchasing additional tokens or upgrading your plan.
                      </p>
                    </CardContent>
                    <CardFooter className="mx-0 px-0 my-0 py-0 mt-3">
                      <Button variant="default" disabled className="w-full px-0 my-0">
                        Coming Soon
                      </Button>
                    </CardFooter>
                  </Card>
                </div>}
              
              <div className="mt-8">
                <h2 className="text-xl text-white mb-3 font-medium px-0 mx-0 my-0 py-0">Token Usage Guide</h2>
                <Card className="bg-inventu-dark border-inventu-gray/30 px-0 py-0">
                  <CardContent className="pt-6 px-0 py-0">
                    <div className="px-[18px] py-[18px]">
                      <p className="py-0 px-0 mx-0 my-0 font-medium text-lg">Tokens are consumed when you use AI features:</p>
                      <ul className="mt-3">
                        <li className="text-stone-600">Text generation: 50-100 tokens per request</li>
                        <li className="text-stone-600">Image generation: 100-200 tokens per image</li>
                        <li className="text-stone-600">Audio processing: 300 tokens per minute</li>
                        <li className="text-stone-600">Video processing: 500 tokens per minute</li>
                      </ul>
                      <p className="mt-3 text-base font-normal text-stone-400 text-justify">
                        Your tokens will reset automatically on a monthly basis.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </MainLayout>
      </div>
    </div>;
};
export default TokensPlans;