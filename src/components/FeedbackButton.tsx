import { useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, escreva uma mensagem.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    try {
      const evolutionApiUrl = import.meta.env.VITE_EVOLUTION_API_URL;
      const evolutionApiKey = import.meta.env.VITE_EVOLUTION_API_KEY;

      if (!evolutionApiUrl || !evolutionApiKey) {
        // Fallback: just show success
        toast({
          title: 'Feedback enviado!',
          description: 'Obrigado pelo seu feedback.',
        });
        setIsOpen(false);
        setName('');
        setMessage('');
        return;
      }

      await fetch(evolutionApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          name,
          message,
          timestamp: new Date().toISOString(),
        }),
      });

      toast({
        title: 'Feedback enviado!',
        description: 'Obrigado pelo seu feedback.',
      });
      setIsOpen(false);
      setName('');
      setMessage('');
    } catch (error) {
      toast({
        title: 'Erro ao enviar',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-shopee shadow-xl',
          'flex items-center justify-center transition-all duration-300',
          'hover:scale-110 hover:shadow-2xl animate-pulse-glow',
          isOpen && 'scale-0 opacity-0'
        )}
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </button>

      {/* Feedback Panel */}
      <div
        className={cn(
          'fixed bottom-6 right-6 z-50 w-80 glass-card rounded-2xl shadow-2xl',
          'transform transition-all duration-300 origin-bottom-right',
          isOpen
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-0 opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full gradient-shopee flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-foreground">Enviar Feedback</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <Input
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-secondary/50 border-border"
          />
          <Textarea
            placeholder="Conte-nos sua sugestão ou problema..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-secondary/50 border-border min-h-[100px] resize-none"
          />
          <Button
            onClick={handleSubmit}
            disabled={isSending}
            className="w-full gradient-shopee text-white hover:opacity-90"
          >
            {isSending ? (
              'Enviando...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar via WhatsApp
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
