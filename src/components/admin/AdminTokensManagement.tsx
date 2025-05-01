
import React, { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const AdminTokensManagement: React.FC = () => {
  const { isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [tokens, setTokens] = useState('10000');
  const [loading, setLoading] = useState(false);

  const handleUpdateTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast.error('Somente administradores podem atualizar tokens');
      return;
    }
    
    if (!email) {
      toast.error('Por favor, insira o email do usuário');
      return;
    }
    
    if (!tokens || isNaN(Number(tokens))) {
      toast.error('Por favor, insira um valor válido de tokens');
      return;
    }
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('admin-update-tokens', {
        body: {
          email,
          tokens: Number(tokens)
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast.success(data.message || 'Tokens atualizados com sucesso');
      setEmail('');
      setTokens('10000');
    } catch (error: any) {
      console.error('Error updating tokens:', error);
      toast.error(error.message || 'Erro ao atualizar tokens');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h2 className="font-bold" style={{ fontSize: "1.5rem" }}>Gerenciamento de Tokens</h2>
        <p className="text-muted-foreground">Adicionar ou remover tokens de usuários</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Atualizar Tokens de Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateTokens} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do Usuário</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tokens">Quantidade de Tokens</Label>
              <Input
                id="tokens"
                type="number"
                placeholder="10000"
                value={tokens}
                onChange={(e) => setTokens(e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Atualizando...' : 'Atualizar Tokens'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTokensManagement;
