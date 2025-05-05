
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ImageGenerator from '@/components/media/ImageGenerator';
import MainLayout from '@/components/layout/MainLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTouchDevice } from '@/hooks/useTouchDevice';
import AppHeader from '@/components/AppHeader';

const ImageGeneratorPage: React.FC = () => {
  const isMobile = useIsMobile();
  const isTouchDevice = useTouchDevice();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="flex min-h-screen w-full bg-inventu-darker">
      <MainLayout 
        sidebarOpen={sidebarOpen} 
        onToggleSidebar={handleToggleSidebar} 
        isTouchDevice={isTouchDevice}
      >
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-inventu-dark border-inventu-gray/30">
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold mb-6 text-white">Gerador de Imagens IA</h1>
                <p className="mb-8 text-white/70">
                  Crie imagens impressionantes usando IA com os modelos Ideogram ou Midjourney.
                  Basta escolher um modelo, definir as configurações e inserir o seu prompt.
                </p>
                
                <ImageGenerator onImageGenerated={(url) => console.log('Imagem gerada:', url)} />
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </div>
  );
};

export default ImageGeneratorPage;
