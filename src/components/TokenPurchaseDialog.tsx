
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Coins, CreditCard } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface TokenPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTokens: number;
}

const TOKEN_PACKAGES = [
  { amount: 1000, price: 19.90 },
  { amount: 5000, price: 79.90 },
  { amount: 10000, price: 149.90 },
];

const TokenPurchaseDialog: React.FC<TokenPurchaseDialogProps> = ({
  open,
  onOpenChange,
  currentTokens,
}) => {
  const [selectedPackage, setSelectedPackage] = useState(0);
  const [purchaseInProgress, setPurchaseInProgress] = useState(false);

  const handlePurchase = async () => {
    setPurchaseInProgress(true);
    
    try {
      // Aqui seria implementada a integração com sistema de pagamentos
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulação
      
      // Simulação de compra bem-sucedida
      toast.success(`Compra de ${TOKEN_PACKAGES[selectedPackage].amount} tokens realizada com sucesso!`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao processar o pagamento. Tente novamente.');
    } finally {
      setPurchaseInProgress(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-inventu-dark text-white border-inventu-gray/20">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Coins className="h-5 w-5 text-inventu-blue" />
            Adicionar Tokens
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Selecione um pacote de tokens para adicionar à sua conta.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-white/80">Saldo atual</Label>
            <div className="flex justify-between items-center">
              <span className="font-medium text-lg text-white">{currentTokens.toLocaleString()} tokens</span>
            </div>
            <Progress value={currentTokens / 100} className="h-2 bg-gray-700" />
          </div>
          
          <div className="space-y-3 pt-2">
            <Label className="text-white/80">Escolha um pacote</Label>
            {TOKEN_PACKAGES.map((pkg, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-3 rounded-lg border transition-all cursor-pointer
                  ${selectedPackage === index 
                    ? 'border-inventu-blue bg-inventu-blue/10' 
                    : 'border-inventu-gray/20 bg-black/20 hover:bg-black/30'
                  }`}
                onClick={() => setSelectedPackage(index)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${selectedPackage === index 
                      ? 'border-inventu-blue' 
                      : 'border-white/40'
                    }`}
                  >
                    {selectedPackage === index && (
                      <div className="w-2 h-2 rounded-full bg-inventu-blue" />
                    )}
                  </div>
                  <span className="font-medium">{pkg.amount.toLocaleString()} tokens</span>
                </div>
                <span className="text-white/80">R${pkg.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-inventu-gray/20 text-white/70 hover:bg-black/20"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handlePurchase} 
            disabled={purchaseInProgress}
            className="bg-gradient-to-r from-inventu-blue to-inventu-purple"
          >
            {purchaseInProgress ? (
              <>Processando...</>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Comprar Tokens
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TokenPurchaseDialog;
