
import React from 'react';
import { Plus, Settings, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const AdminModelsManagement = () => {
  const models = [
    {
      id: 1,
      name: 'GPT-4 Turbo',
      type: 'Chat',
      status: 'Active',
      usageCount: 12453,
      averageResponseTime: '1.2s'
    },
    {
      id: 2,
      name: 'Claude 3',
      type: 'Chat',
      status: 'Active',
      usageCount: 8721,
      averageResponseTime: '1.5s'
    },
    {
      id: 3,
      name: 'DALL-E 3',
      type: 'Image',
      status: 'Active',
      usageCount: 3421,
      averageResponseTime: '3.2s'
    }
  ];

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Modelos de IA</h2>
          <p className="text-muted-foreground mt-2">
            Gerencie os modelos de IA disponíveis na plataforma
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
          <Plus className="mr-2 h-4 w-4" />
          Novo Modelo
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="backdrop-blur-lg bg-white/10 border border-white/20 transition-all hover:scale-[1.02]">
          <CardHeader>
            <CardTitle>Modelos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">7</div>
            <p className="text-muted-foreground">Total de modelos em uso</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-lg bg-white/10 border border-white/20 transition-all hover:scale-[1.02]">
          <CardHeader>
            <CardTitle>Chamadas Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">24.5k</div>
            <p className="text-muted-foreground">Requisições processadas</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-lg bg-white/10 border border-white/20 transition-all hover:scale-[1.02]">
          <CardHeader>
            <CardTitle>Tempo Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1.8s</div>
            <p className="text-muted-foreground">Tempo médio de resposta</p>
          </CardContent>
        </Card>
      </div>

      <Card className="backdrop-blur-lg bg-white/10 border border-white/20">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Modelos Disponíveis</span>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Tempo Médio</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.name}</TableCell>
                  <TableCell>{model.type}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                      {model.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{model.usageCount.toLocaleString()}</TableCell>
                  <TableCell>{model.averageResponseTime}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Detalhes
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminModelsManagement;
