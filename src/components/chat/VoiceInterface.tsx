
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PhoneCall, PhoneOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';

interface VoiceInterfaceProps {
  onSpeakingChange: (speaking: boolean) => void;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onSpeakingChange }) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const chatRef = useRef<RealtimeChat | null>(null);

  const handleMessage = (event: any) => {
    console.log('Received message:', event);
    
    if (event.type === 'response.audio.delta') {
      onSpeakingChange(true);
    } else if (event.type === 'response.audio.done') {
      onSpeakingChange(false);
    }
  };

  const startCall = async () => {
    try {
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init();
      setIsConnected(true);
      
      toast({
        title: "Connected",
        description: "Voice call is active",
      });
    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to start call',
        variant: "destructive",
      });
    }
  };

  const endCall = () => {
    chatRef.current?.disconnect();
    setIsConnected(false);
    onSpeakingChange(false);
  };

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
      {!isConnected ? (
        <Button 
          onClick={startCall}
          size="icon"
          className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 shadow-lg"
        >
          <PhoneCall className="h-8 w-8" />
        </Button>
      ) : (
        <Button 
          onClick={endCall}
          size="icon"
          variant="destructive"
          className="h-16 w-16 rounded-full shadow-lg"
        >
          <PhoneOff className="h-8 w-8" />
        </Button>
      )}
    </div>
  );
};

export default VoiceInterface;
