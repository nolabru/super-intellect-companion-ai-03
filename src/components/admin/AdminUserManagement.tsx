import React, { useState, useEffect } from 'react';
import { Search, UserRound, MoreHorizontal, Filter, Download, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  user_metadata: {
    name?: string;
  };
  is_admin?: boolean;
}
const AdminUserManagement: React.FC = () => {
  const {
    user
  } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  useEffect(() => {
    fetchUsers();
  }, []);
  useEffect(() => {
    if (users.length > 0) {
      const results = users.filter(user => user.email.toLowerCase().includes(searchTerm.toLowerCase()) || user.user_metadata?.name && user.user_metadata.name.toLowerCase().includes(searchTerm.toLowerCase()));
      setFilteredUsers(results);
    }
  }, [searchTerm, users]);
  const fetchUsers = async () => {
    try {
      // For this demo, we're using a mock user list since we don't have direct access to auth.users table
      // In a real implementation, you would create an Edge Function to fetch users
      setLoading(true);

      // Simulate API call delay
      setTimeout(() => {
        const mockUsers: User[] = [{
          id: '1',
          email: 'user1@example.com',
          created_at: '2023-11-15T10:30:00Z',
          last_sign_in_at: '2023-12-01T14:22:00Z',
          user_metadata: {
            name: 'John Doe'
          },
          is_admin: false
        }, {
          id: '2',
          email: 'user2@example.com',
          created_at: '2023-11-16T11:45:00Z',
          last_sign_in_at: '2023-11-30T09:15:00Z',
          user_metadata: {
            name: 'Jane Smith'
          },
          is_admin: false
        }, {
          id: '3',
          email: 'admin@admin.com',
          created_at: '2023-11-01T09:00:00Z',
          last_sign_in_at: '2023-12-02T10:00:00Z',
          user_metadata: {
            name: 'Admin User'
          },
          is_admin: true
        }, {
          id: '4',
          email: 'user4@example.com',
          created_at: '2023-11-20T16:30:00Z',
          last_sign_in_at: null,
          user_metadata: {
            name: 'Robert Johnson'
          },
          is_admin: false
        }, {
          id: '5',
          email: 'user5@example.com',
          created_at: '2023-11-25T13:15:00Z',
          last_sign_in_at: '2023-11-28T11:45:00Z',
          user_metadata: {
            name: 'Emily Davis'
          },
          is_admin: false
        }];
        setUsers(mockUsers);
        setFilteredUsers(mockUsers);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Falha ao buscar usuários');
      setLoading(false);
    }
  };

  // Get current users for pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const exportToCSV = () => {
    try {
      const headers = ['ID', 'Email', 'Nome', 'Data de Criação', 'Último Login', 'Admin'];
      const csvData = filteredUsers.map(user => [user.id, user.email, user.user_metadata?.name || '', formatDate(user.created_at), formatDate(user.last_sign_in_at || null), user.is_admin ? 'Sim' : 'Não']);
      const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `usuarios_${new Date().toISOString()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Dados exportados com sucesso');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Falha ao exportar dados');
    }
  };
  const handleActionClick = (action: string, userId: string, userEmail: string) => {
    switch (action) {
      case 'view':
        toast.info(`Visualizando detalhes de ${userEmail}`);
        break;
      case 'edit':
        toast.info(`Editando usuário ${userEmail}`);
        break;
      case 'delete':
        toast.info(`Solicitado exclusão de ${userEmail}`);
        break;
      case 'resetPassword':
        toast.success(`Solicitação de redefinição de senha enviada para ${userEmail}`);
        break;
      default:
        break;
    }
  };
  return <div className="space-y-6 p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 style={{
          fontSize: "1.5rem"
        }} className="text-2xl font-medium text-left">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">Visualize e gerencie os usuários do sistema</p>
        </div>
        
        <div className="flex gap-2 self-end sm:self-auto">
          <Button variant="outline" size="sm" onClick={exportToCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-auto flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar por email ou nome..." className="pl-8 w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtrar
          </Button>
        </div>
      </div>
      
      <Card className="overflow-hidden">
        <CardHeader className="bg-card py-4">
          <CardTitle className="text-lg">Usuários</CardTitle>
          <CardDescription>Total: {filteredUsers.length} usuários</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-12">Status</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="hidden sm:table-cell">Cadastro</TableHead>
                  <TableHead className="hidden md:table-cell">Último Login</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="w-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({
                length: 5
              }).map((_, i) => <TableRow key={`skeleton-${i}`}>
                      <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>) : currentUsers.length > 0 ? currentUsers.map(user => <TableRow key={user.id}>
                      <TableCell>
                        {user.last_sign_in_at ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <UserRound className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{user.user_metadata?.name || 'Sem nome'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatDate(user.last_sign_in_at)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {user.is_admin ? <Badge className="bg-primary">Admin</Badge> : <Badge variant="outline">Usuário</Badge>}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleActionClick('view', user.id, user.email)}>
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleActionClick('edit', user.id, user.email)}>
                              Editar perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleActionClick('resetPassword', user.id, user.email)}>
                              Redefinir senha
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => handleActionClick('delete', user.id, user.email)}>
                              Excluir usuário
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>) : <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        {filteredUsers.length > usersPerPage && <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} de {filteredUsers.length}
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                Anterior
              </Button>
              {Array.from({
            length: Math.ceil(filteredUsers.length / usersPerPage)
          }).map((_, i) => <Button key={i} variant={currentPage === i + 1 ? "default" : "outline"} size="sm" onClick={() => paginate(i + 1)}>
                  {i + 1}
                </Button>)}
              <Button variant="outline" size="sm" onClick={() => paginate(currentPage + 1)} disabled={currentPage === Math.ceil(filteredUsers.length / usersPerPage)}>
                Próximo
              </Button>
            </div>
          </div>}
      </Card>
    </div>;
};
export default AdminUserManagement;