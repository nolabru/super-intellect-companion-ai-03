
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ServicesConfig: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Configurações de Serviços</h1>
      </div>
      
      <div className="p-8 text-center">
        <p className="text-gray-500">
          A configuração de serviços externos foi removida desta versão.
        </p>
      </div>
    </div>
  );
};

export default ServicesConfig;
