
import React from 'react';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SettingsSidebarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ sidebarOpen, onToggleSidebar }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };
  
  return (
    <Sheet open={sidebarOpen} onOpenChange={onToggleSidebar}>
      <SheetContent className="w-[300px] sm:w-[400px] bg-inventu-darker border-l border-gray-800">
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Configurações</h2>
            <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-inventu-gray/30 rounded-lg">
              <h3 className="font-medium mb-2">Usuário</h3>
              <p className="text-sm text-gray-300">{user?.email}</p>
            </div>
            
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={handleLogout}
            >
              Sair
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSidebar;
