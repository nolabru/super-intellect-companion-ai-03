
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanCardProps {
  name: string;
  price: number;
  tokenAmount: number;
  features: PlanFeature[];
  isCurrentPlan?: boolean;
  onSelect: () => void;
  buttonText: string;
  className?: string;
}

const PlanCard: React.FC<PlanCardProps> = ({
  name,
  price,
  tokenAmount,
  features,
  isCurrentPlan = false,
  onSelect,
  buttonText,
  className,
}) => {
  return (
    <div
      className={`bg-inventu-dark/80 backdrop-blur-lg border transition-all rounded-xl overflow-hidden shadow-xl
        ${isCurrentPlan 
          ? 'border-inventu-blue/60 shadow-inventu-blue/20' 
          : 'border-inventu-gray/20 hover:border-white/20'
        }
        ${className || ''}
      `}
    >
      {isCurrentPlan && (
        <div className="bg-gradient-to-r from-inventu-blue to-inventu-purple py-1.5 px-4 text-center">
          <span className="text-sm font-medium text-white">Seu Plano Atual</span>
        </div>
      )}
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-white">{name}</h3>
        
        <div className="mt-4 mb-6">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-white">R${price}</span>
            <span className="text-white/60 ml-1">/mês</span>
          </div>
          <div className="mt-1 text-white/70 text-sm">
            {tokenAmount.toLocaleString()} tokens por mês
          </div>
        </div>
        
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full mr-2 ${
                feature.included ? 'bg-inventu-blue/20 text-inventu-blue' : 'bg-gray-800/50 text-gray-500'
              }`}>
                <CheckIcon className="h-3.5 w-3.5" />
              </span>
              <span className={feature.included ? 'text-white/80' : 'text-white/40 line-through'}>
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
        
        <Button
          onClick={onSelect}
          className={isCurrentPlan
            ? 'w-full bg-inventu-blue hover:bg-inventu-blue/90'
            : 'w-full bg-gradient-to-r from-inventu-blue to-inventu-purple hover:from-inventu-blue/90 hover:to-inventu-purple/90'
          }
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

export default PlanCard;
