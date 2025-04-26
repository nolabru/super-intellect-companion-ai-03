import React from 'react';
import { Users, CreditCard, BarChart2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Visão Geral</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((card, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className={`text-xs ${card.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
                  {card.change} {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Usuários Recentes</CardTitle>
            <CardDescription>Últimos usuários registrados</CardDescription>
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
                <tbody className="divide-y">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="hover:bg-muted/50">
                      <td className="p-3 text-sm">Usuário {i}</td>
                      <td className="p-3 text-sm">usuario{i}@example.com</td>
                      <td className="p-3 text-sm">
                        <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                          {i % 3 === 0 ? 'Premium' : 'Básico'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-4">
            <Button variant="outline" size="sm">Ver Todos</Button>
          </CardFooter>
        </Card>
        
        <Card className="col-span-1">
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
                      className="h-full bg-primary" 
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
      
      <Card className="overflow-hidden mt-6">
        <CardHeader>
          <CardTitle>Uso de Tokens Recente</CardTitle>
          <CardDescription>Consumo de tokens nos últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Gráfico será implementado aqui</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
