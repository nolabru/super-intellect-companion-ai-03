
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const AdminUserStats: React.FC = () => {
  // Mock data for user statistics
  const userStats = [
    { id: 1, name: 'João Silva', email: 'joao@example.com', plan: 'Premium', mediaCount: 124, lastActive: '2 horas atrás' },
    { id: 2, name: 'Maria Santos', email: 'maria@example.com', plan: 'Básico', mediaCount: 47, lastActive: '5 horas atrás' },
    { id: 3, name: 'Pedro Costa', email: 'pedro@example.com', plan: 'Premium', mediaCount: 301, lastActive: '1 dia atrás' },
    { id: 4, name: 'Ana Pereira', email: 'ana@example.com', plan: 'Empresarial', mediaCount: 520, lastActive: '3 horas atrás' },
    { id: 5, name: 'Carlos Oliveira', email: 'carlos@example.com', plan: 'Premium', mediaCount: 89, lastActive: 'Agora mesmo' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Estatísticas de Usuários</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,248</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Crescimento Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">+12.5%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.2%</div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Usuários Mais Ativos</CardTitle>
          <CardDescription>Baseado no consumo de recursos e frequência de uso</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-right">Mídias Geradas</TableHead>
                  <TableHead>Última Atividade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userStats.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.plan === 'Premium' ? 'bg-blue-100 text-blue-800' : 
                        user.plan === 'Empresarial' ? 'bg-purple-100 text-purple-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.plan}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{user.mediaCount}</TableCell>
                    <TableCell>{user.lastActive}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Planos</CardTitle>
            <CardDescription>Porcentagem de usuários em cada plano</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-muted-foreground">Gráfico será implementado aqui</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Atividade por Hora do Dia</CardTitle>
            <CardDescription>Quando os usuários estão mais ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-muted-foreground">Gráfico será implementado aqui</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUserStats;
