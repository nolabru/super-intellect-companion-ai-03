
import React from 'react';
import { Users, CreditCard, BarChart2, Clock, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminOverview: React.FC = () => {
  const statsCards = [
    {
      title: 'Usuários Ativos',
      value: '1,248',
      change: '+12.5%',
      changeType: 'positive',
      icon: Users,
      description: 'vs. mês passado'
    },
    {
      title: 'Receita Mensal',
      value: 'R$ 24,500',
      change: '+8.2%',
      changeType: 'positive',
      icon: CreditCard,
      description: 'vs. mês passado'
    },
    {
      title: 'Total de Gerações',
      value: '12,540',
      change: '+22.5%',
      changeType: 'positive',
      icon: BarChart2,
      description: 'vs. mês passado'
    },
    {
      title: 'Tempo Médio de Uso',
      value: '24.5min',
      change: '-2.5%',
      changeType: 'negative',
      icon: Clock,
      description: 'vs. mês passado'
    }
  ];

  const usageData = [
    { name: 'Jan', tokens: 4000 },
    { name: 'Fev', tokens: 3000 },
    { name: 'Mar', tokens: 2000 },
    { name: 'Abr', tokens: 2780 },
    { name: 'Mai', tokens: 1890 },
    { name: 'Jun', tokens: 2390 },
    { name: 'Jul', tokens: 3490 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-4">Visão Geral</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((card, index) => (
            <Card key={index} className="overflow-hidden border-border/40 backdrop-blur-sm bg-card/80">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className={`text-xs flex items-center gap-1 ${card.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
                  {card.changeType === 'positive' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {card.change} {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 border-border/40 backdrop-blur-sm bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Usuários Recentes</CardTitle>
              <CardDescription>Últimos usuários registrados</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              Ver todos
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[300px]">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="p-3 text-left text-xs font-medium text-muted-foreground">Nome</th>
                    <th className="p-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                    <th className="p-3 text-left text-xs font-medium text-muted-foreground">Plano</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="hover:bg-muted/50">
                      <td className="p-3 text-sm">Usuário {i + 1}</td>
                      <td className="p-3 text-sm">usuario{i + 1}@example.com</td>
                      <td className="p-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${i % 3 === 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {i % 3 === 0 ? 'Premium' : 'Básico'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 border-border/40 backdrop-blur-sm bg-card/80">
          <CardHeader>
            <CardTitle>Modelos Mais Usados</CardTitle>
            <CardDescription>Uso dos modelos nos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            {['DALL-E 3', 'GPT-4', 'Claude 3 Opus', 'Midjourney'].map((model, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="font-medium">{model}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${90 - i * 15}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground w-8">{90 - i * 15}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      
      <Card className="overflow-hidden border-border/40 backdrop-blur-sm bg-card/80">
        <CardHeader>
          <CardTitle>Uso de Tokens Recente</CardTitle>
          <CardDescription>Consumo de tokens nos últimos 7 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={usageData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(30, 30, 30, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Bar dataKey="tokens" name="Tokens" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
