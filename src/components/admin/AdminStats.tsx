
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChartBar, ChartLine, ChartPie } from 'lucide-react';
import { ChartContainer } from '@/components/ui/chart';
import TokenUsageChart from '@/components/TokenUsageChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const AdminStats: React.FC = () => {
  // Mock data for demonstration
  const monthlyUsers = [
    { month: 'Jan', usuarios: 120 },
    { month: 'Feb', usuarios: 180 },
    { month: 'Mar', usuarios: 250 },
    { month: 'Apr', usuarios: 310 },
    { month: 'May', usuarios: 420 },
  ];

  const modelUsage = [
    { name: 'GPT-4', value: 45 },
    { name: 'Claude', value: 30 },
    { name: 'DALL-E', value: 25 },
  ];

  const pieColors = ['#3B82F6', '#9333EA', '#6366F1'];

  const tokenData = [
    { date: '2025-04-20', usado: 15000, limite: 20000 },
    { date: '2025-04-21', usado: 17500, limite: 20000 },
    { date: '2025-04-22', usado: 16800, limite: 20000 },
    { date: '2025-04-23', usado: 19200, limite: 20000 },
    { date: '2025-04-24', usado: 18400, limite: 20000 },
  ];

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Estatísticas e Relatórios</h2>
        <p className="text-muted-foreground mt-2">
          Visualize métricas e tendências importantes do sistema
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="backdrop-blur-lg bg-white/10 border border-white/20 transition-all hover:scale-[1.02]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartLine className="h-5 w-5 text-blue-500" />
              Crescimento Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">+24.5%</div>
            <p className="text-muted-foreground">Em relação ao mês anterior</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-lg bg-white/10 border border-white/20 transition-all hover:scale-[1.02]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartPie className="h-5 w-5 text-purple-500" />
              Total de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,248</div>
            <p className="text-muted-foreground">Usuários ativos</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-lg bg-white/10 border border-white/20 transition-all hover:scale-[1.02]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBar className="h-5 w-5 text-indigo-500" />
              Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8.2%</div>
            <p className="text-muted-foreground">Média nos últimos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="backdrop-blur-lg bg-white/10 border border-white/20">
          <CardHeader>
            <CardTitle>Crescimento de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyUsers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#1E1E1E', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px' 
                    }} 
                  />
                  <Bar dataKey="usuarios" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-lg bg-white/10 border border-white/20">
          <CardHeader>
            <CardTitle>Distribuição de Uso por Modelo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modelUsage}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {modelUsage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: '#1E1E1E', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px' 
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Usage Chart */}
      <Card className="backdrop-blur-lg bg-white/10 border border-white/20">
        <CardHeader>
          <CardTitle>Consumo de Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <TokenUsageChart data={tokenData} className="h-[300px]" />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStats;
