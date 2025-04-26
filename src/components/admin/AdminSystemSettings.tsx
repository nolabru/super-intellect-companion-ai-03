
import React from 'react';
import { Settings2, Globe, Bell, Shield, Database, Code } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

// Define the type for our settings form values
type SettingsFormValues = {
  maintenanceMode: boolean;
  debugMode: boolean;
  notifications: boolean;
  apiLogging: boolean;
  securityAlerts: boolean;
}

// Define the type for individual settings
type SettingItem = {
  id: keyof SettingsFormValues;
  label: string;
  description: string;
}

// Define the type for settings sections
type SettingsSection = {
  title: string;
  icon: React.ElementType;
  description: string;
  settings: SettingItem[];
}

const AdminSystemSettings = () => {
  const form = useForm<SettingsFormValues>({
    defaultValues: {
      maintenanceMode: false,
      debugMode: false,
      notifications: true,
      apiLogging: true,
      securityAlerts: true,
    }
  });

  const onSubmit = (data: SettingsFormValues) => {
    console.log('Settings updated:', data);
  };

  const settingsSections: SettingsSection[] = [
    {
      title: 'Geral',
      icon: Settings2,
      description: 'Configurações gerais do sistema',
      settings: [
        { id: 'maintenanceMode', label: 'Modo Manutenção', description: 'Ativar modo de manutenção do sistema' },
        { id: 'debugMode', label: 'Modo Debug', description: 'Ativar logs de debug' }
      ]
    },
    {
      title: 'API & Integrações',
      icon: Code,
      description: 'Gerenciar integrações e APIs',
      settings: [
        { id: 'apiLogging', label: 'Log de API', description: 'Registrar todas as chamadas de API' }
      ]
    },
    {
      title: 'Notificações',
      icon: Bell,
      description: 'Configurar notificações do sistema',
      settings: [
        { id: 'notifications', label: 'Notificações', description: 'Ativar notificações do sistema' },
        { id: 'securityAlerts', label: 'Alertas de Segurança', description: 'Receber alertas de segurança' }
      ]
    }
  ];

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h2>
        <p className="text-muted-foreground mt-2">
          Gerencie todas as configurações do sistema em um só lugar
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {settingsSections.map((section) => (
            <Card key={section.title} className="backdrop-blur-lg bg-white/10 border border-white/20 transition-all hover:bg-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <section.icon className="h-5 w-5 text-inventu-blue" />
                  {section.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.settings.map((setting) => (
                  <FormField
                    key={setting.id}
                    control={form.control}
                    name={setting.id}
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-white/10 p-4 hover:bg-white/5">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">{setting.label}</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            {setting.description}
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
          
          <div className="flex justify-end">
            <Button type="submit" className="bg-gradient-to-r from-inventu-blue to-purple-500 hover:from-inventu-blue/90 hover:to-purple-500/90">
              Salvar Configurações
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AdminSystemSettings;
