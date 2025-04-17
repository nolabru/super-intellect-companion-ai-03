
import React from 'react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Calendar, FileSpreadsheet, FileText } from 'lucide-react';

interface GoogleCommandSuggestionsProps {
  isVisible: boolean;
  onSelect: (command: string) => void;
}

const commands = [
  {
    command: '@calendar',
    description: 'Crie eventos no Google Calendar',
    icon: Calendar
  },
  {
    command: '@sheet',
    description: 'Leia ou escreva em planilhas do Google Sheets',
    icon: FileSpreadsheet
  },
  {
    command: '@doc',
    description: 'Crie ou atualize documentos no Google Docs',
    icon: FileText
  }
];

const GoogleCommandSuggestions = ({ isVisible, onSelect }: GoogleCommandSuggestionsProps) => {
  if (!isVisible) return null;

  return (
    <div className="absolute bottom-full left-0 w-full mb-2 bg-popover rounded-lg border shadow-lg">
      <Command>
        <CommandList>
          <CommandGroup heading="Comandos do Google Workspace">
            {commands.map(({ command, description, icon: Icon }) => (
              <CommandItem
                key={command}
                onSelect={() => onSelect(command)}
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent"
              >
                <Icon className="h-4 w-4" />
                <div>
                  <p className="font-medium">{command}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
};

export default GoogleCommandSuggestions;
