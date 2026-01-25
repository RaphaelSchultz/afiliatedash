import { useCallback, useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseCSV, validateVendaRow, validateClickRow } from '@/lib/csvParser';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { TablesInsert } from '@/integrations/supabase/types';

type UploadStatus = 'idle' | 'parsing' | 'uploading' | 'success' | 'error';

interface UploadResult {
  type: 'vendas' | 'clicks';
  total: number;
  success: number;
  failed: number;
}

export function InlineUpload() {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<'vendas' | 'clicks' | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para fazer upload.',
        variant: 'destructive',
      });
      return;
    }

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, envie um arquivo CSV.',
        variant: 'destructive',
      });
      return;
    }

    setStatus('parsing');
    setProgress(10);
    setErrorMessage(null);
    setResult(null);

    try {
      const content = await file.text();
      const parsed = parseCSV(content);

      if (parsed.type === 'unknown') {
        setStatus('error');
        setErrorMessage(
          'Não foi possível identificar o tipo do arquivo. Verifique se os cabeçalhos estão corretos.'
        );
        return;
      }

      setDetectedType(parsed.type);
      setProgress(30);
      setStatus('uploading');

      const batchSize = 100;
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < parsed.data.length; i += batchSize) {
        const batch = parsed.data.slice(i, i + batchSize);
        
        if (parsed.type === 'vendas') {
          const validBatch = batch.filter(row => validateVendaRow(row)).map(row => ({
            user_id: user.id,
            order_id: String(row.order_id || ''),
            item_id: Number(row.item_id) || 0,
            purchase_time: row.purchase_time ? String(row.purchase_time) : null,
            actual_amount: Number(row.actual_amount) || null,
            net_commission: Number(row.net_commission) || null,
            total_commission: Number(row.total_commission) || null,
            status: row.status ? String(row.status) : null,
            sub_id1: row.sub_id1 ? String(row.sub_id1) : null,
            sub_id2: row.sub_id2 ? String(row.sub_id2) : null,
            sub_id3: row.sub_id3 ? String(row.sub_id3) : null,
            sub_id4: row.sub_id4 ? String(row.sub_id4) : null,
            sub_id5: row.sub_id5 ? String(row.sub_id5) : null,
            channel: row.channel ? String(row.channel) : null,
            shop_name: row.shop_name ? String(row.shop_name) : null,
          })) as TablesInsert<'shopee_vendas'>[];

          if (validBatch.length > 0) {
            const { error } = await supabase
              .from('shopee_vendas')
              .upsert(validBatch, {
                onConflict: 'user_id,order_id,item_id',
                ignoreDuplicates: false,
              });

            if (error) {
              console.error('Upload error:', error);
              failCount += validBatch.length;
            } else {
              successCount += validBatch.length;
            }
          }
          failCount += batch.length - validBatch.length;
        } else {
          const validBatch = batch.filter(row => validateClickRow(row)).map(row => ({
            user_id: user.id,
            click_time: String(row.click_time || new Date().toISOString()),
            credential_id: 1, // Default credential - will need to be fetched from user's credentials
            region: row.region ? String(row.region) : null,
            referrer: row.referrer ? String(row.referrer) : null,
            sub_id1: row.sub_id1 ? String(row.sub_id1) : null,
            sub_id2: row.sub_id2 ? String(row.sub_id2) : null,
            sub_id3: row.sub_id3 ? String(row.sub_id3) : null,
            sub_id4: row.sub_id4 ? String(row.sub_id4) : null,
            sub_id5: row.sub_id5 ? String(row.sub_id5) : null,
          })) as TablesInsert<'shopee_clicks'>[];

          if (validBatch.length > 0) {
            const { error } = await supabase
              .from('shopee_clicks')
              .insert(validBatch);

            if (error) {
              console.error('Upload error:', error);
              failCount += validBatch.length;
            } else {
              successCount += validBatch.length;
            }
          }
          failCount += batch.length - validBatch.length;
        }
        setProgress(30 + Math.floor(((i + batchSize) / parsed.data.length) * 60));
      }

      setProgress(100);
      setResult({
        type: parsed.type,
        total: parsed.rowCount,
        success: successCount,
        failed: failCount,
      });
      setStatus('success');

      // Registrar upload no histórico
      await supabase.from('upload_history').insert({
        user_id: user.id,
        file_name: file.name,
        file_type: parsed.type,
        records_count: successCount,
        file_size_bytes: file.size,
      });

      // Update last sync date
      await supabase
        .from('profiles')
        .update({ last_sync_data: new Date().toISOString() })
        .eq('id', user.id);

      toast({
        title: 'Upload concluído!',
        description: `${successCount} registros de ${parsed.type === 'vendas' ? 'vendas' : 'cliques'} salvos com sucesso.`,
      });
    } catch (error) {
      console.error('Parse error:', error);
      setStatus('error');
      setErrorMessage('Erro ao processar o arquivo. Verifique o formato.');
    }
  }, [user]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    e.target.value = '';
  }, [handleFile]);

  const reset = () => {
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setErrorMessage(null);
    setDetectedType(null);
  };

  return (
    <div className="glass-card rounded-2xl p-8">
      <h2 className="text-xl font-semibold text-foreground mb-2">Upload de Relatórios</h2>
      <p className="text-muted-foreground mb-6">
        Arraste arquivos CSV de Vendas ou Cliques da Shopee. O sistema detectará automaticamente o tipo.
      </p>

      {status === 'idle' && (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center',
            'border-2 border-dashed rounded-xl p-12 cursor-pointer',
            'transition-all duration-300',
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-border hover:border-primary/50 hover:bg-secondary/30'
          )}
        >
          <div className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all',
            isDragging ? 'gradient-shopee scale-110' : 'bg-secondary'
          )}>
            <Upload className={cn(
              'w-8 h-8',
              isDragging ? 'text-white' : 'text-muted-foreground'
            )} />
          </div>
          <p className="text-lg font-medium text-foreground mb-1">
            {isDragging ? 'Solte o arquivo aqui' : 'Arraste seu arquivo CSV'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            ou clique para selecionar
          </p>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              Vendas
            </span>
            <span className="px-3 py-1 rounded-full bg-info/10 text-info text-xs font-medium">
              Cliques
            </span>
          </div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
      )}

      {(status === 'parsing' || status === 'uploading') && (
        <div className="flex flex-col items-center py-12">
          <div className="w-16 h-16 rounded-2xl gradient-shopee flex items-center justify-center mb-4 animate-pulse">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg font-medium text-foreground mb-2">
            {status === 'parsing' ? 'Analisando arquivo...' : 'Salvando dados...'}
          </p>
          {detectedType && (
            <p className="text-sm text-muted-foreground mb-4">
              Tipo detectado: <span className="text-primary font-medium capitalize">{detectedType}</span>
            </p>
          )}
          <div className="w-full max-w-xs">
            <Progress value={progress} className="h-2" />
          </div>
          <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
        </div>
      )}

      {status === 'success' && result && (
        <div className="flex flex-col items-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <p className="text-lg font-medium text-foreground mb-2">Upload concluído!</p>
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground">
              Tipo: <span className="text-foreground font-medium capitalize">{result.type}</span>
            </p>
            <p className="text-2xl font-bold text-success mt-2">{result.success}</p>
            <p className="text-sm text-muted-foreground">registros salvos</p>
            {result.failed > 0 && (
              <p className="text-sm text-warning mt-2">
                {result.failed} registros ignorados (inválidos ou duplicados)
              </p>
            )}
          </div>
          <Button onClick={reset} variant="outline">
            Fazer novo upload
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-lg font-medium text-foreground mb-2">Erro no upload</p>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
            {errorMessage}
          </p>
          <Button onClick={reset} variant="outline">
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 p-4 rounded-xl bg-secondary/30 border border-border">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Dica</p>
            <p className="text-sm text-muted-foreground">
              Os arquivos CSV devem conter cabeçalhos como "Order ID" para vendas ou "Click Time" para cliques. 
              O sistema aceita formatos brasileiros (vírgula para decimal, DD/MM/YYYY para datas).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
