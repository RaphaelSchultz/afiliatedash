import { useCallback, useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseCSV } from '@/lib/csvParser';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { fromZonedTime } from 'date-fns-tz';
import type { TablesInsert } from '@/integrations/supabase/types';

type UploadStatus = 'idle' | 'parsing' | 'uploading' | 'success' | 'error';

interface UploadResult {
  type: 'vendas' | 'clicks';
  total: number;
  success: number;
  failed: number;
}

const translateStatus = (status: string | null): string | null => {
  if (!status) return null;

  const s = status.trim().toLowerCase();

  if (s === 'concluído' || s === 'concluido' || s === 'completo') return 'Completed';
  if (s === 'pendente') return 'Pending';
  if (s === 'cancelado') return 'Cancelled';
  if (s === 'pago') return 'Paid';
  if (s === 'processando') return 'Processing';
  if (s === 'enviado') return 'Shipped';

  // Return original if no match (or if already in English)
  return status;
};

const translateAttribution = (attribution: string | null): string | null => {
  if (!attribution) return null;

  const s = attribution.trim().toLowerCase();

  if (s === 'pedido em loja diferente' || s === 'ordered_in_different_shop') return 'ORDERED_IN_DIFFERENT_SHOP';
  if (s === 'pedido na mesma loja' || s === 'ordered_in_same_shop') return 'ORDERED_IN_SAME_SHOP';

  return attribution;
};

export function InlineUpload() {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<'vendas' | 'clicks' | null>(null);
  

  const [credentialId, setCredentialId] = useState<number | null>(null);

  // Fetch user's credential ID
  useEffect(() => {
    if (!user) return;

    const fetchCredential = async () => {
      const { data, error } = await supabase
        .from('shopee_credentials')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (data) {
        setCredentialId(data.id);
      }
    };

    fetchCredential();
  }, [user]);


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

      let successCount = 0;
      let failCount = 0;
      const totalRows = parsed.data.length;

      if (parsed.type === 'vendas') {
        const timeZone = 'America/Sao_Paulo';
        const formatDate = (dateStr: unknown) => {
          if (!dateStr) return null;
          try {
            // Parse raw string (BRT) to UTC
            // e.g. "2026-01-26 15:38:00" -> 2026-01-26T18:38:00.000Z
            return fromZonedTime(String(dateStr), timeZone).toISOString();
          } catch (e) {
            console.error('Date parse error:', dateStr, e);
            return null;
          }
        };

        // Map ALL rows first
        const rawMappedRows = parsed.data.map(row => ({
          user_id: user.id,
          order_id: String(row.order_id || ''),
          item_id: Number(row.item_id) || 0,
          purchase_time: formatDate(row.purchase_time),
          complete_time: formatDate(row.complete_time),
          click_time: formatDate(row.click_time),
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
          item_shopee_commission_rate: row.item_shopee_commission_rate as number | null,
          item_seller_commission_rate: row.item_seller_commission_rate as number | null,
          mcn_fee_rate: row.mcn_fee_rate as number | null,
          rate: row.rate as number | null,
          qty: row.qty as number | null,
          conversion_id: row.conversion_id as number | null,
          checkout_id: row.checkout_id ? String(row.checkout_id) : null,
          order_status: translateStatus(row.order_status ? String(row.order_status) : null),
          status: translateStatus(row.order_status ? String(row.order_status) : null), // Status follows order_status
          conversion_status: row.conversion_status ? String(row.conversion_status) : null,
          buyer_type: row.buyer_type ? String(row.buyer_type) : null,
          shop_name: row.shop_name ? String(row.shop_name) : null,
          shop_id: row.shop_id ? String(row.shop_id) : null,
          shop_type: row.shop_type ? String(row.shop_type) : null,
          item_name: row.item_name ? String(row.item_name) : null,
          item_model_id: row.item_model_id ? String(row.item_model_id) : null,
          product_type: row.product_type ? String(row.product_type) : null,
          promotion_id: row.promotion_id ? String(row.promotion_id) : null,
          item_notes: row.item_notes ? String(row.item_notes) : null,
          category_l1: row.category_l1 ? String(row.category_l1) : null,
          category_l2: row.category_l2 ? String(row.category_l2) : null,
          category_l3: row.category_l3 ? String(row.category_l3) : null,
          campaign_type: row.campaign_type ? String(row.campaign_type) : null,
          attribution_type: translateAttribution(row.attribution_type ? String(row.attribution_type) : null),
          campaign_partner_name: row.campaign_partner_name ? String(row.campaign_partner_name) : null,
          mcn_name: row.mcn_name ? String(row.mcn_name) : null,
          sub_id1: row.sub_id1 ? String(row.sub_id1) : null,
          sub_id2: row.sub_id2 ? String(row.sub_id2) : null,
          sub_id3: row.sub_id3 ? String(row.sub_id3) : null,
          sub_id4: row.sub_id4 ? String(row.sub_id4) : null,
          sub_id5: row.sub_id5 ? String(row.sub_id5) : null,
          channel: row.channel ? String(row.channel) : null,
        }));

        // AGGREGATE duplicate items: SUM financial values, keep LAST value for descriptive fields
        const aggregationMap = new Map<string, typeof rawMappedRows[0]>();

        for (const row of rawMappedRows) {
          const key = `${row.user_id}_${row.order_id}_${row.item_id}`;

          if (!aggregationMap.has(key)) {
            // First occurrence: just store it
            aggregationMap.set(key, { ...row });
          } else {
            // Duplicate found: aggregate values
            const existing = aggregationMap.get(key)!;

            // SUM financial values
            existing.actual_amount = (existing.actual_amount || 0) + (row.actual_amount || 0);
            existing.net_commission = (existing.net_commission || 0) + (row.net_commission || 0);
            existing.qty = (existing.qty || 0) + (row.qty || 0);
            existing.refund_amount = (existing.refund_amount || 0) + (row.refund_amount || 0);
            existing.shopee_commission = (existing.shopee_commission || 0) + (row.shopee_commission || 0);
            existing.seller_commission = (existing.seller_commission || 0) + (row.seller_commission || 0);
            existing.brand_commission = (existing.brand_commission || 0) + (row.brand_commission || 0);
            existing.item_total_commission = (existing.item_total_commission || 0) + (row.item_total_commission || 0);
            existing.mcn_fee = (existing.mcn_fee || 0) + (row.mcn_fee || 0);
            existing.item_commission = (existing.item_commission || 0) + (row.item_commission || 0);
            existing.gross_commission = (existing.gross_commission || 0) + (row.gross_commission || 0);

            // NOTE: total_commission is usually Order Total, so we DON'T sum it for duplicate items of the same order.
            // We treat it as Descriptive/Last Write.

            // LAST WRITE for descriptive fields (latest status wins)
            existing.total_commission = row.total_commission || existing.total_commission;
            existing.order_status = row.order_status || existing.order_status;
            existing.status = row.status || existing.status;
            existing.conversion_status = row.conversion_status || existing.conversion_status;
            existing.purchase_time = row.purchase_time || existing.purchase_time;
            existing.complete_time = row.complete_time || existing.complete_time;
            existing.click_time = row.click_time || existing.click_time;
            existing.item_name = row.item_name || existing.item_name;
            existing.item_price = row.item_price || existing.item_price;
            existing.shop_name = row.shop_name || existing.shop_name;
            existing.shop_id = row.shop_id || existing.shop_id;
            existing.shop_type = row.shop_type || existing.shop_type;
            existing.item_model_id = row.item_model_id || existing.item_model_id;
            existing.product_type = row.product_type || existing.product_type;
            existing.promotion_id = row.promotion_id || existing.promotion_id;
            existing.item_notes = row.item_notes || existing.item_notes;
            existing.checkout_id = row.checkout_id || existing.checkout_id;
            existing.category_l1 = row.category_l1 || existing.category_l1;
            existing.category_l2 = row.category_l2 || existing.category_l2;
            existing.category_l3 = row.category_l3 || existing.category_l3;
            existing.campaign_type = row.campaign_type || existing.campaign_type;
            existing.attribution_type = row.attribution_type || existing.attribution_type;
            existing.campaign_partner_name = row.campaign_partner_name || existing.campaign_partner_name;
            existing.mcn_name = row.mcn_name || existing.mcn_name;
            existing.buyer_type = row.buyer_type || existing.buyer_type;
            existing.sub_id1 = row.sub_id1 || existing.sub_id1;
            existing.sub_id2 = row.sub_id2 || existing.sub_id2;
            existing.sub_id3 = row.sub_id3 || existing.sub_id3;
            existing.sub_id4 = row.sub_id4 || existing.sub_id4;
            existing.sub_id5 = row.sub_id5 || existing.sub_id5;
            existing.channel = row.channel || existing.channel;
            existing.item_shopee_commission_rate = row.item_shopee_commission_rate || existing.item_shopee_commission_rate;
            existing.item_seller_commission_rate = row.item_seller_commission_rate || existing.item_seller_commission_rate;
            existing.mcn_fee_rate = row.mcn_fee_rate || existing.mcn_fee_rate;
            existing.rate = row.rate || existing.rate;
            existing.conversion_id = row.conversion_id || existing.conversion_id;
          }
        }

        const aggregatedRows = Array.from(aggregationMap.values());
        console.log(`[AGGREGATED] ${rawMappedRows.length} linhas → ${aggregatedRows.length} itens únicos`);

        // Bulk upsert in batches of 500
        const batchSize = 500;
        for (let i = 0; i < aggregatedRows.length; i += batchSize) {
          const batch = aggregatedRows.slice(i, i + batchSize);

          const { error } = await supabase
            .from('shopee_vendas')
            .upsert(batch, {
              onConflict: 'user_id,order_id,item_id',
              ignoreDuplicates: false,
            });

          if (error) {
            console.error('Upload error batch', i, error);
            failCount += batch.length;
          } else {
            successCount += batch.length;
          }

          setProgress(30 + Math.floor(((i + batchSize) / aggregatedRows.length) * 60));
        }
      } else {
        // Clicks - process in batches (no unique constraint issues)
        if (!credentialId) {
          setStatus('error');
          setErrorMessage('Nenhuma credencial encontrada. Configure sua integração Shopee primeiro.');
          return;
        }

        const batchSize = 100;
        for (let j = 0; j < parsed.data.length; j += batchSize) {
          const batch = parsed.data.slice(j, j + batchSize);
          const mappedRows = batch.map(row => ({
            user_id: user.id,
            click_time: String(row.click_time || new Date().toISOString()),
            credential_id: credentialId,
            region: row.region ? String(row.region) : null,
            referrer: row.referrer ? String(row.referrer) : null,
            sub_id1: row.sub_id1 ? String(row.sub_id1) : null,
            sub_id2: row.sub_id2 ? String(row.sub_id2) : null,
            sub_id3: row.sub_id3 ? String(row.sub_id3) : null,
            sub_id4: row.sub_id4 ? String(row.sub_id4) : null,
            sub_id5: row.sub_id5 ? String(row.sub_id5) : null,
            click_pv: row.click_pv ? Number(row.click_pv) : 1,
          })) as TablesInsert<'shopee_clicks'>[];

          if (mappedRows.length > 0) {
            const { error } = await supabase
              .from('shopee_clicks')
              .insert(mappedRows);

            if (error) {
              console.error('Upload error:', error);
              failCount += mappedRows.length;
            } else {
              successCount += mappedRows.length;
            }
          }
          setProgress(30 + Math.floor(((j + batchSize) / parsed.data.length) * 60));
        }
      }

      setProgress(100);
      setResult({
        type: parsed.type,
        total: parsed.rowCount,
        success: successCount,
        failed: failCount,
      });
      setStatus('success');

      // Save upload history
      await supabase.from('upload_history').insert({
        user_id: user.id,
        file_name: file.name,
        file_type: parsed.type === 'clicks' ? 'cliques' : parsed.type,
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
  }, [user, credentialId]);

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
              {result.failed > 0 && (
                <p className="text-sm text-destructive mt-2">
                  {result.failed} registros com erro de inserção
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

    </div>
  );
}
