
import React from 'react';
import { Calendar, FileSpreadsheet, Folder } from 'lucide-react';

interface GoogleServiceOption {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}

interface GoogleServicesAutocompleteProps {
  visible: boolean;
  onSelect: (service: string) => void;
}

const GoogleServicesAutocomplete: React.FC<GoogleServicesAutocompleteProps> = ({
  visible,
  onSelect,
}) => {
  const services: GoogleServiceOption[] = [
    {
      id: '@drive',
      icon: <Folder className="h-4 w-4 text-blue-500" />,
      label: '@drive',
      description: 'Gerenciar arquivos',
    },
    {
      id: '@sheet',
      icon: <FileSpreadsheet className="h-4 w-4 text-green-500" />,
      label: '@sheet',
      description: 'Usar planilhas',
    },
    {
      id: '@calendar',
      icon: <Calendar className="h-4 w-4 text-red-500" />,
      label: '@calendar',
      description: 'Criar eventos',
    },
  ];

  if (!visible) {
    return null;
  }

  return (
    <div className="absolute left-0 bottom-full w-full mb-1 bg-inventu-dark border border-inventu-gray/30 rounded-md shadow-lg overflow-hidden">
      <div className="p-1 text-xs text-inventu-gray border-b border-inventu-gray/30">
        Serviços Google
      </div>
      <ul className="max-h-48 overflow-y-auto">
        {services.map((service) => (
          <li
            key={service.id}
            className="flex items-center gap-2 px-3 py-2 text-white hover:bg-inventu-gray/20 cursor-pointer"
            onClick={() => onSelect(service.id)}
          >
            {service.icon}
            <div className="flex flex-col">
              <span className="font-medium">{service.label}</span>
              <span className="text-xs text-inventu-gray">{service.description}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GoogleServicesAutocomplete;
