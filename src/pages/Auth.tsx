
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import AppHeader from '@/components/AppHeader';

type AuthMode = 'login' | 'signup';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar sua conta.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-inventu-darker flex flex-col">
      <AppHeader />
      
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-inventu-dark p-8 rounded-xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {mode === 'login' ? 'Entrar na conta' : 'Criar nova conta'}
          </h2>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-inventu-card border-inventu-gray/30"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-inventu-card border-inventu-gray/30"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-inventu-blue hover:bg-inventu-blue/80"
              disabled={loading}
            >
              {loading 
                ? 'Processando...' 
                : mode === 'login' ? 'Entrar' : 'Cadastrar'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-inventu-blue hover:underline text-sm"
            >
              {mode === 'login'
                ? 'Não tem uma conta? Cadastre-se'
                : 'Já tem uma conta? Faça login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
