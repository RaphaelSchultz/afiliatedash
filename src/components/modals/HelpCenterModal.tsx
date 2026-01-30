
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Bug, Mail, Loader2, Send, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface HelpCenterModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function HelpCenterModal({ open, onOpenChange }: HelpCenterModalProps) {
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            // Limit file size to 5MB
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error('O arquivo deve ter no máximo 5MB.');
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
    };

    const handleSendReport = async () => {
        if (!message.trim()) {
            toast.error('Por favor, descreva o problema.');
            return;
        }

        setIsSending(true);
        try {
            let mediaUrl = null;

            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('bug-reports')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('bug-reports')
                    .getPublicUrl(fileName);

                mediaUrl = publicUrl;
                mediaUrl = publicUrl;
            }

            // Save payload to database
            const reportPayload = {
                user_id: user?.id,
                name: user?.user_metadata?.full_name || user?.email,
                email: user?.email,
                message,
                media_url: mediaUrl,
                status: 'open'
            };

            const { error: dbError } = await supabase
                .from('support_tickets')
                .insert(reportPayload);

            if (dbError) {
                console.error('Error saving report to DB:', dbError);
                // We continue to send WhatsApp even if DB save fails, or we could stop.
                // For now, let's log it but try to notify.
            }

            const { data, error } = await supabase.functions.invoke('send-whatsapp-report', {
                body: {
                    message,
                    mediaUrl,
                    user_context: {
                        name: user?.user_metadata?.full_name || user?.email,
                        email: user?.email,
                        tenant_id: user?.id,
                    }
                }
            });

            if (error) throw error;

            toast.success('Report enviado com sucesso! Obrigado por nos ajudar.');
            setMessage('');
            setFile(null);
            onOpenChange(false);
        } catch (error) {
            console.error('Error sending report:', error);
            toast.error('Erro ao enviar report. Tente novamente mais tarde.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
                        <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            ?
                        </span>
                        Central de Ajuda
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Encontrou um problema ou precisa de suporte?
                    </p>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Section: Report Bug */}
                    <div className="border rounded-xl p-4 space-y-3 bg-card/50">
                        <div className="flex items-center gap-2 text-red-500 font-semibold text-sm">
                            <Bug className="w-4 h-4" />
                            Reportar um Bug
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Encontrou algo que não funciona? Descreva o problema e nossa equipe irá analisar.
                        </p>

                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Descreva o problema que você encontrou..."
                            className="min-h-[100px] resize-none text-sm"
                        />

                        {file && (
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-xs">
                                <span className="truncate max-w-[200px]">{file.name}</span>
                                <button
                                    onClick={handleRemoveFile}
                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                            />
                            <Label
                                htmlFor="file-upload"
                                className="flex items-center justify-center p-2 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                                title="Anexar mídia"
                            >
                                <Paperclip className="w-5 h-5 text-muted-foreground" />
                            </Label>

                            <Button
                                onClick={handleSendReport}
                                disabled={isSending}
                                className="flex-1 bg-primary text-white hover:bg-primary/90"
                            >
                                {isSending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Enviar Report
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Section: Contact Support */}
                    <div className="border rounded-xl p-4 space-y-3 bg-card/50">
                        <div className="flex items-center gap-2 text-blue-500 font-semibold text-sm">
                            <Mail className="w-4 h-4" />
                            Falar com o Suporte
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Precisa de ajuda ou tem alguma dúvida? Entre em contato conosco:
                        </p>

                        <a
                            href="mailto:suporte@afiliatedash.com.br"
                            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                <Mail className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-foreground">suporte@afiliatedash.com.br</span>
                        </a>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
