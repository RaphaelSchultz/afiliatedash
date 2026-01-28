import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, CreditCard, MessageSquare, LogOut, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  collapsed?: boolean;
}

export function UserMenu({ collapsed = false }: UserMenuProps) {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const userInitials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  const handleFeedbackSubmit = async () => {
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
        toast({
          title: 'Feedback enviado!',
          description: 'Obrigado pelo seu feedback.',
        });
        setFeedbackOpen(false);
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
      setFeedbackOpen(false);
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-3 w-full rounded-xl p-2 transition-colors cursor-pointer',
              'bg-secondary/50 hover:bg-secondary border border-transparent',
              'dark:bg-white/5 dark:hover:bg-white/10 dark:border-transparent',
              'light:border-border',
              collapsed && 'justify-center'
            )}
          >
            <Avatar className="h-11 w-11">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
              <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-sm font-medium truncate">
                  {profile?.full_name || 'Usuário'}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </span>
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={collapsed ? 'start' : 'center'}
          side={collapsed ? 'right' : 'top'}
          sideOffset={12}
          className={cn(
            'p-0 bg-card/95 backdrop-blur-lg border-border/50 shadow-xl shadow-black/20 z-50',
            collapsed ? 'w-72' : 'w-[244px]' // 256px - 12px (2*6px margin)
          )}
        >
          {/* User Profile Header */}


          {/* Menu Items */}
          <div className="p-1.5">
            <DropdownMenuItem
              className="flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer"
              onClick={() => navigate('/my-account')}
            >
              <User className="w-4 h-4" />
              <span>Minha Conta</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-not-allowed opacity-70">
              <CreditCard className="w-4 h-4" />
              <span>Cobranças</span>
              <Badge variant="secondary" className="ml-auto bg-primary text-primary-foreground text-[10px] px-1.5">
                Em Breve
              </Badge>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer"
              onClick={() => setFeedbackOpen(true)}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Feedback</span>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator className="my-0" />

          <div className="p-1.5">
            <DropdownMenuItem
              className="flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Feedback Dialog */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full gradient-shopee flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              Enviar Feedback
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
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
              onClick={handleFeedbackSubmit}
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
        </DialogContent>
      </Dialog>
    </>
  );
}
