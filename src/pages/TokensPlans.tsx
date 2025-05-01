
import React, { useState, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { tokenService } from '@/services/tokenService';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Loader2, Coins, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TokensPlans = () => {
  const [loading, setLoading] = useState(true);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    const loadTokenInfo = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const balance = await tokenService.getUserTokenBalance(user.id);
        setTokenInfo(balance);
        setError(null);
      } catch (err) {
        console.error('Error loading token information:', err);
        setError('Error loading token information. Please try again later.');
        toast.error('Error loading token information');
      } finally {
        setLoading(false);
      }
    };
    
    loadTokenInfo();
  }, [user]);
  
  // Format reset date
  const formatResetDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    
    try {
      const resetDate = new Date(dateString);
      return format(resetDate, "d 'of' MMMM, yyyy", { locale: ptBR });
    } catch (err) {
      return 'Invalid date';
    }
  };
  
  // Calculate days until reset
  const getDaysUntilReset = () => {
    if (!tokenInfo?.nextResetDate) return null;
    return tokenService.getDaysUntilReset(tokenInfo.nextResetDate);
  };
  
  if (!user) {
    return (
      <div className="min-h-screen bg-inventu-darker">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center">Please log in to view your tokens.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-inventu-darker">
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Token Management</h1>
        
        {loading ? (
          <Card className="bg-inventu-dark border-inventu-gray/30">
            <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-inventu-blue" />
                <p className="mt-2">Loading token information...</p>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="bg-inventu-dark border-inventu-gray/30 border-red-500/50">
            <CardContent className="pt-6">
              <div className="text-center text-red-400">
                <p>{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="bg-inventu-dark border-inventu-gray/30">
              <CardHeader>
                <CardTitle>Current Balance</CardTitle>
                <CardDescription>Your current token usage and balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Coins className="h-5 w-5 mr-2 text-inventu-blue" />
                      <span>Available Tokens</span>
                    </div>
                    <span className="text-xl font-bold">{tokenInfo?.tokensRemaining || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-inventu-blue" />
                      <span>Next Reset</span>
                    </div>
                    <span>
                      {tokenInfo?.nextResetDate ? (
                        <>
                          {formatResetDate(tokenInfo.nextResetDate)}
                          {getDaysUntilReset() !== null && (
                            <span className="ml-2 text-sm text-inventu-gray">
                              ({getDaysUntilReset()} days)
                            </span>
                          )}
                        </>
                      ) : (
                        'Not scheduled'
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-inventu-dark border-inventu-gray/30">
              <CardHeader>
                <CardTitle>Get More Tokens</CardTitle>
                <CardDescription>Available plans and options</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-inventu-gray">
                  Contact us for information about purchasing additional tokens or upgrading your plan.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="default" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
        
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4">Token Usage Guide</h2>
          <Card className="bg-inventu-dark border-inventu-gray/30">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p>Tokens are consumed when you use AI features:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Text generation: 50-100 tokens per request</li>
                  <li>Image generation: 100-200 tokens per image</li>
                  <li>Audio processing: 300 tokens per minute</li>
                  <li>Video processing: 500 tokens per minute</li>
                </ul>
                <p className="text-inventu-gray text-sm mt-4">
                  Your tokens will reset automatically on a monthly basis.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TokensPlans;
