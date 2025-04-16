
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import TokenUsageChart from '@/components/TokenUsageChart';
import PlanCard, { PlanFeature } from '@/components/PlanCard';
import TokenPurchaseDialog from '@/components/TokenPurchaseDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Coins, PlusCircle, BarChart3, Shield, Zap } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

// Dados dos planos
const PLANS = [
  {
    id: 'start',
    name: 'Start',
    price: 29.90,
    tokenAmount: 5000,
    features: [
      { text: 'Até 5.000 tokens/mês', included: true },
      { text: 'Acesso a modelos básicos', included: true },
      { text: 'Suporte via email', included: true },
      { text: 'Acesso a modelos avançados', included: false },
      { text: 'Uso ilimitado de memória', included: false },
      { text: 'Suporte prioritário', included: false },
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 79.90,
    tokenAmount: 20000,
    features: [
      { text: 'Até 20.000 tokens/mês', included: true },
      { text: 'Acesso a modelos básicos', included: true },
      { text: 'Suporte via email', included: true },
      { text: 'Acesso a modelos avançados', included: true },
      { text: 'Uso ilimitado de memória', included: false },
      { text: 'Suporte prioritário', included: false },
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 149.90,
    tokenAmount: 50000,
    features: [
      { text: 'Até 50.000 tokens/mês', included: true },
      { text: 'Acesso a modelos básicos', included: true },
      { text: 'Suporte via email', included: true },
      { text: 'Acesso a modelos avançados', included: true },
      { text: 'Uso ilimitado de memória', included: true },
      { text: 'Suporte prioritário', included: true },
    ],
  },
];

// Gera dados fictícios para o gráfico de uso
const generateMockData = () => {
  const data = [];
  for (let i = 30; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const usado = Math.floor(Math.random() * 500) + 100;
    data.push({
      date: format(date, 'dd/MM', { locale: ptBR }),
      usado,
      limite: 10000,
    });
  }
  return data;
};

const TokensPlans: React.FC = () => {
  const { user } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<{ tokens_remaining: number; tokens_used: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [usageData, setUsageData] = useState(generateMockData());

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchTokenInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('user_tokens')
          .select('tokens_remaining, tokens_used')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar informações de tokens:', error);
        } else {
          setTokenInfo(data);
          
          // Simulação de plano atual baseado no uso de tokens
          if (data.tokens_remaining + data.tokens_used <= 5000) {
            setCurrentPlan('start');
          } else if (data.tokens_remaining + data.tokens_used <= 20000) {
            setCurrentPlan('standard');
          } else {
            setCurrentPlan('plus');
          }
        }
      } catch (err) {
        console.error('Erro ao buscar tokens:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenInfo();
  }, [user]);

  const handlePlanSelect = (planId: string) => {
    if (!user) {
      toast.error('Faça login para assinar um plano');
      return;
    }
    
    if (planId === currentPlan) {
      toast.info('Você já possui este plano');
      return;
    }
    
    // Aqui seria implementada a integração com sistema de pagamento para assinatura
    toast.success(`Solicitação de assinatura do plano ${planId} registrada. Em breve estará disponível.`);
  };

  if (!user) {
    return (
      <div className="container max-w-7xl py-10">
        <Alert className="bg-inventu-dark/50 border border-white/10 text-white">
          <AlertDescription>
            Por favor, faça login para visualizar seus tokens e planos disponíveis.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-10 px-4 md:px-6">
      <div className="flex flex-col space-y-8">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Tokens e Planos</h1>
            <p className="text-white/70 mt-1">
              Gerencie seu uso de tokens e escolha o plano ideal para suas necessidades
            </p>
          </div>
          
          <Button
            onClick={() => setIsPurchaseDialogOpen(true)}
            className="bg-gradient-to-r from-inventu-blue to-inventu-purple hover:from-inventu-blue/90 hover:to-inventu-purple/90"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar Tokens
          </Button>
        </div>
        
        {/* Card de resumo de tokens */}
        <Card className="bg-inventu-dark/80 backdrop-blur-lg border-inventu-gray/20 shadow-lg overflow-hidden">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Coins className="h-5 w-5 text-inventu-blue" />
                  Seu Saldo de Tokens
                </h2>
                
                {loading ? (
                  <div className="animate-pulse bg-white/10 h-8 w-32 rounded"></div>
                ) : (
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-white">
                      {tokenInfo?.tokens_remaining.toLocaleString() || 0}
                    </span>
                    <span className="text-white/60 ml-2 text-sm">
                      tokens disponíveis
                    </span>
                  </div>
                )}
                
                {!loading && tokenInfo && (
                  <div className="text-sm text-white/60">
                    {tokenInfo.tokens_used.toLocaleString()} tokens utilizados este mês
                  </div>
                )}
              </div>
              
              <div className="flex gap-4">
                <div className="text-center p-4 bg-black/20 border border-white/5 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-inventu-blue mx-auto mb-2" />
                  <div className="text-white/80 text-sm">Plano atual</div>
                  <div className="text-white font-medium">
                    {currentPlan === 'start' && 'Start'}
                    {currentPlan === 'standard' && 'Standard'}
                    {currentPlan === 'plus' && 'Plus'}
                    {!currentPlan && '-'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-black/20 border border-white/5 rounded-lg">
                  <Zap className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                  <div className="text-white/80 text-sm">Próximo reset</div>
                  <div className="text-white font-medium">
                    {format(new Date(new Date().setDate(new Date().getDate() + 12)), "d 'de' MMMM", { locale: ptBR })}
                  </div>
                </div>
              </div>
            </div>
            
            <Separator className="bg-white/5" />
            
            {/* Gráfico de uso */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-inventu-blue" />
                Histórico de Uso
              </h3>
              <TokenUsageChart data={usageData} />
            </div>
          </CardContent>
        </Card>
        
        {/* Cartões de planos */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-inventu-blue" />
            Planos Disponíveis
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                name={plan.name}
                price={plan.price}
                tokenAmount={plan.tokenAmount}
                features={plan.features}
                isCurrentPlan={currentPlan === plan.id}
                onSelect={() => handlePlanSelect(plan.id)}
                buttonText={currentPlan === plan.id ? "Seu Plano Atual" : "Assinar Plano"}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Dialog para compra de tokens adicionais */}
      <TokenPurchaseDialog
        open={isPurchaseDialogOpen}
        onOpenChange={setIsPurchaseDialogOpen}
        currentTokens={tokenInfo?.tokens_remaining || 0}
      />
    </div>
  );
};

export default TokensPlans;
