import { useCallback, useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, History, Calendar, FileUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseCSV, validateVendaRow, validateClickRow } from '@/lib/csvParser';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TablesInsert, Tables } from '@/integrations/supabase/types';

type UploadStatus = 'idle' | 'parsing' | 'uploading' | 'success' | 'error';
type UploadHistoryRow = Tables<'upload_history'>;

interface UploadResult {
  type: 'vendas' | 'clicks';
  total: number;
  success: number;
  failed: number;
  duplicates?: number;
}

export function InlineUpload() {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<'vendas' | 'clicks' | null>(null);
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryRow[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Fetch upload history
  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      const { data, error } = await supabase
        .from('upload_history')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setUploadHistory(data);
      }
      setIsLoadingHistory(false);
    };

    fetchHistory();
  }, [user, result]); // Refetch when upload completes

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
      let duplicatesRemoved = 0;

      // For vendas: deduplicate the entire dataset first by (order_id, item_id)
      // Keep the LAST occurrence (most recent data)
      let dataToProcess = parsed.data;
      if (parsed.type === 'vendas') {
        const uniqueMap = new Map<string, Record<string, unknown>>();
        for (const row of parsed.data) {
          if (row.order_id && row.item_id !== null && row.item_id !== undefined) {
            const key = `${row.order_id}|${row.item_id}`;
            uniqueMap.set(key, row);
          }
        }
        dataToProcess = Array.from(uniqueMap.values());
        duplicatesRemoved = parsed.data.length - dataToProcess.length;
        console.log(`Deduplicated: ${parsed.data.length} -> ${dataToProcess.length} (${duplicatesRemoved} duplicates removed)`);
      }

      for (let i = 0; i < dataToProcess.length; i += batchSize) {
        const batch = dataToProcess.slice(i, i + batchSize);
        
        if (parsed.type === 'vendas') {
          // Map all valid rows first
          const mappedRows = batch.filter(row => validateVendaRow(row)).map(row => ({
            // Required fields
            user_id: user.id,
            order_id: String(row.order_id || ''),
            item_id: Number(row.item_id) || 0,
            
            // Timestamps
            purchase_time: row.purchase_time ? String(row.purchase_time) : null,
            complete_time: row.complete_time ? String(row.complete_time) : null,
            click_time: row.click_time ? String(row.click_time) : null,
            
            // Financial - currency fields (already parsed as numbers)
            net_commission: row.net_commission as number | null,
            actual_amount: row.actual_amount as number | null,
            item_price: row.item_price as number | null,
            total_commission: row.total_commission as number | null,
            item_commission: row.item_commission as number | null,
            refund_amount: row.refund_amount as number | null,
            shopee_commission: row.shopee_commission as number | null,
            brand_commission: row.brand_commission as number | null,
            seller_commission: row.seller_commission as number | null,
            mcn_fee: row.mcn_fee as number | null,
            gross_commission: row.gross_commission as number | null,
            item_total_commission: row.item_total_commission as number | null,
            
            // Percentage fields (already parsed as decimals)
            item_shopee_commission_rate: row.item_shopee_commission_rate as number | null,
            item_seller_commission_rate: row.item_seller_commission_rate as number | null,
            mcn_fee_rate: row.mcn_fee_rate as number | null,
            rate: row.rate as number | null,
            
            // Integer fields
            qty: row.qty as number | null,
            conversion_id: row.conversion_id as number | null,
            
            // Status fields
            order_status: row.order_status ? String(row.order_status) : null,
            status: row.order_status ? String(row.order_status) : null,
            conversion_status: row.conversion_status ? String(row.conversion_status) : null,
            buyer_type: row.buyer_type ? String(row.buyer_type) : null,
            
            // Shop information
            shop_name: row.shop_name ? String(row.shop_name) : null,
            shop_id: row.shop_id ? String(row.shop_id) : null,
            shop_type: row.shop_type ? String(row.shop_type) : null,
            
            // Item details
            item_name: row.item_name ? String(row.item_name) : null,
            item_model_id: row.item_model_id ? String(row.item_model_id) : null,
            product_type: row.product_type ? String(row.product_type) : null,
            promotion_id: row.promotion_id ? String(row.promotion_id) : null,
            item_notes: row.item_notes ? String(row.item_notes) : null,
            
            // Categories
            category_l1: row.category_l1 ? String(row.category_l1) : null,
            category_l2: row.category_l2 ? String(row.category_l2) : null,
            category_l3: row.category_l3 ? String(row.category_l3) : null,
            
            // Campaign & Attribution
            campaign_type: row.campaign_type ? String(row.campaign_type) : null,
            attribution_type: row.attribution_type ? String(row.attribution_type) : null,
            campaign_partner_name: row.campaign_partner_name ? String(row.campaign_partner_name) : null,
            
            // MCN
            mcn_name: row.mcn_name ? String(row.mcn_name) : null,
            
            // Sub IDs
            sub_id1: row.sub_id1 ? String(row.sub_id1) : null,
            sub_id2: row.sub_id2 ? String(row.sub_id2) : null,
            sub_id3: row.sub_id3 ? String(row.sub_id3) : null,
            sub_id4: row.sub_id4 ? String(row.sub_id4) : null,
            sub_id5: row.sub_id5 ? String(row.sub_id5) : null,
            
            // Channel
            channel: row.channel ? String(row.channel) : null,
          }));

          // Deduplicate within batch by keeping the last occurrence (most recent data)
          const uniqueMap = new Map<string, typeof mappedRows[0]>();
          for (const row of mappedRows) {
            const key = `${row.order_id}|${row.item_id}`;
            uniqueMap.set(key, row); // Later entries overwrite earlier ones
          }
          const validBatch = Array.from(uniqueMap.values()) as TablesInsert<'shopee_vendas'>[];

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
          // Count duplicates removed within batch
          const duplicatesInBatch = mappedRows.length - validBatch.length;
          failCount += (batch.length - mappedRows.length); // Invalid rows only
        } else {
          const validBatch = batch.filter(row => validateClickRow(row)).map(row => ({
            user_id: user.id,
            click_time: String(row.click_time || new Date().toISOString()),
            credential_id: 1,
            region: row.region ? String(row.region) : null,
            referrer: row.referrer ? String(row.referrer) : null,
            sub_id1: row.sub_id1 ? String(row.sub_id1) : null,
            sub_id2: row.sub_id2 ? String(row.sub_id2) : null,
            sub_id3: row.sub_id3 ? String(row.sub_id3) : null,
            sub_id4: row.sub_id4 ? String(row.sub_id4) : null,
            sub_id5: row.sub_id5 ? String(row.sub_id5) : null,
            click_pv: row.click_pv ? Number(row.click_pv) : 1,
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
        setProgress(30 + Math.floor(((i + batchSize) / dataToProcess.length) * 60));
      }

      setProgress(100);
      setResult({
        type: parsed.type,
        total: parsed.rowCount,
        success: successCount,
        failed: failCount,
        duplicates: duplicatesRemoved,
      });
      setStatus('success');

      // Save upload history
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

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Card */}
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
              {(result.duplicates ?? 0) > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {result.duplicates} duplicados consolidados
                </p>
              )}
              {result.failed > 0 && (
                <p className="text-sm text-warning mt-2">
                  {result.failed} registros inválidos
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
                Os arquivos CSV devem conter cabeçalhos como "ID do pedido" para vendas ou "Click Time" para cliques. 
                O sistema aceita formatos brasileiros (vírgula para decimal, DD/MM/YYYY para datas) e internacionais.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload History */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <History className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Histórico de Uploads</h3>
            <p className="text-sm text-muted-foreground">Últimas sincronizações</p>
          </div>
        </div>
        
        {isLoadingHistory ? (
          <div className="py-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Carregando histórico...</p>
          </div>
        ) : uploadHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileUp className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Faça seu primeiro upload para ver o histórico.</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {uploadHistory.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    upload.file_type === 'vendas' 
                      ? "bg-primary/10 text-primary" 
                      : "bg-info/10 text-info"
                  )}>
                    <FileText className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate text-sm">
                      {upload.file_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded capitalize",
                        upload.file_type === 'vendas' 
                          ? "bg-primary/10 text-primary" 
                          : "bg-info/10 text-info"
                      )}>
                        {upload.file_type}
                      </span>
                      <span>•</span>
                      <span>{upload.records_count} registros</span>
                      <span>•</span>
                      <span>{formatFileSize(upload.file_size_bytes)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {format(new Date(upload.uploaded_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
