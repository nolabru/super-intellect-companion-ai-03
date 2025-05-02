
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ApiframeConfig from '@/components/apiframe/ApiframeConfig';
import OpenRouterConfig from '@/components/openrouter/OpenRouterConfig';

const ServicesConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState('apiframe');
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="apiframe">APIframe.ai</TabsTrigger>
          <TabsTrigger value="openrouter">OpenRouter</TabsTrigger>
        </TabsList>
        
        <TabsContent value="apiframe" className="mt-6">
          <ApiframeConfig />
        </TabsContent>
        
        <TabsContent value="openrouter" className="mt-6">
          <OpenRouterConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServicesConfig;
