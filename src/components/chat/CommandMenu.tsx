
import React from 'react';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar, FileSpreadsheet, FileText } from 'lucide-react';

export interface CommandOption {
  command: string;
  description: string;
  icon: React.ReactNode;
}

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (command: string) => void;
  triggerRef: React.RefObject<HTMLElement>;
}

const commands: CommandOption[] = [
  {
    command: '@calendar',
    description: 'Criar ou gerenciar eventos no Google Calendar',
    icon: <Calendar className="mr-2 h-5 w-5 text-purple-500" />
  },
  {
    command: '@sheet',
    description: 'Ler ou escrever em planilhas do Google Sheets',
    icon: <FileSpreadsheet className="mr-2 h-5 w-5 text-green-500" />
  },
  {
    command: '@doc',
    description: 'Criar ou editar documentos no Google Docs',
    icon: <FileText className="mr-2 h-5 w-5 text-blue-500" />
  }
];

export const CommandMenu: React.FC<CommandMenuProps> = ({
  isOpen,
  onClose,
  onSelect,
  triggerRef
}) => {
  return (
    <Popover open={isOpen} onOpenChange={onClose}>
      <PopoverTrigger asChild>
        <span ref={triggerRef} className="hidden" />
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 w-full" 
        align="start"
        side="bottom"
        sideOffset={10}
      >
        <Command>
          <CommandInput placeholder="Digite um comando..." />
          <CommandList>
            <CommandGroup heading="Comandos disponíveis">
              {commands.map((cmd) => (
                <CommandItem
                  key={cmd.command}
                  onSelect={() => {
                    onSelect(cmd.command);
                    onClose();
                  }}
                  className="flex items-center cursor-pointer hover:bg-inventu-dark/50 transition-colors"
                >
                  {cmd.icon}
                  <div>
                    <p className="font-medium text-white">{cmd.command}</p>
                    <p className="text-sm text-muted-foreground">{cmd.description}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
