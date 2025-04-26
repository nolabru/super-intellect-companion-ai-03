
import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const AdminPlansManagement = () => {
  const plans = [
    {
      id: 1,
      name: 'Básico',
      price: 'R$ 29,90',
      status: 'Ativo',
      features: ['5 projetos', '1000 tokens', 'Suporte básico'],
      users: 245
    },
    {
      id: 2,
      name: 'Pro',
      price: 'R$ 59,90',
      status: 'Ativo',
      features: ['Projetos ilimitados', '5000 tokens', 'Suporte prioritário'],
      users: 158
    },
    {
      id: 3,
      name: 'Enterprise',
      price: 'R$ 199,90',
      status: 'Ativo',
      features: ['Tudo do Pro', 'API dedicada', 'Gerente de conta'],
      users: 32
    }
  ];

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Planos</h2>
          <p className="text-muted-foreground mt-2">
            Gerencie os planos e preços disponíveis na plataforma
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="backdrop-blur-lg bg-white/10 border border-white/20 transition-all hover:scale-[1.02]">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{plan.name}</span>
                <Badge variant="secondary">{plan.price}/mês</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Usuários ativos</p>
                  <p className="text-2xl font-bold">{plan.users}</p>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="text-sm flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="backdrop-blur-lg bg-white/10 border border-white/20">
        <CardHeader>
          <CardTitle>Histórico de Alterações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Alteração</TableHead>
                <TableHead>Autor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>24/04/2025</TableCell>
                <TableCell>Pro</TableCell>
                <TableCell>Atualização de preço</TableCell>
                <TableCell>Admin</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>23/04/2025</TableCell>
                <TableCell>Enterprise</TableCell>
                <TableCell>Nova feature adicionada</TableCell>
                <TableCell>Admin</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPlansManagement;
