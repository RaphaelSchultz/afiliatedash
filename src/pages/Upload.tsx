import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InlineUpload } from '@/components/upload/InlineUpload';

export default function UploadPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Upload de Relatórios
          </h1>
          <p className="text-muted-foreground">
            Importe seus relatórios CSV da Shopee para visualizar métricas detalhadas.
          </p>
        </div>

        {/* Upload Component with History */}
        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <InlineUpload />
        </div>

        {/* Instructions */}
        <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h3 className="font-semibold text-foreground mb-4">Como exportar relatórios da Shopee</h3>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                1
              </span>
              <span>Acesse o painel de afiliados da Shopee</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                2
              </span>
              <span>Vá em "Relatórios" → "Vendas" ou "Cliques"</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                3
              </span>
              <span>Selecione o período desejado e clique em "Exportar CSV"</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                4
              </span>
              <span>Faça upload do arquivo aqui</span>
            </li>
          </ol>
        </div>
      </div>
    </DashboardLayout>
  );
}
