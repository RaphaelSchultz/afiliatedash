import { useEffect, useState } from 'react';
import { DollarSign, Users, TrendingUp, Wallet, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { KPICard, KPICardSkeleton } from '@/components/dashboard/KPICard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AdminStats {
  kpis: {
    total_users: number;
    active_subs: number;
    mrr: number;
    projected_revenue: number;
  } | null;
  distribution: Array<{
    plan_name: string;
    user_count: number;
  }> | null;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data, error } = await supabase.rpc('get_admin_stats');

        if (error) throw error;

        setStats(data as unknown as AdminStats);
      } catch (err: any) {
        console.error('Error fetching admin stats:', err);
        setError(err.message || 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const kpis = stats?.kpis;
  const distribution = stats?.distribution || [];
  const avgTicket = kpis && kpis.active_subs > 0 
    ? kpis.mrr / kpis.active_subs 
    : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
          </>
        ) : (
          <>
            <KPICard
              title="MRR Atual"
              value={formatCurrency(kpis?.mrr || 0)}
              icon={DollarSign}
              subtitle="Receita Recorrente Mensal"
            />
            <KPICard
              title="Usuários Ativos"
              value={kpis?.active_subs || 0}
              icon={Users}
              subtitle={`de ${kpis?.total_users || 0} total`}
            />
            <KPICard
              title="Ticket Médio"
              value={formatCurrency(avgTicket)}
              icon={TrendingUp}
              subtitle="Por assinante"
            />
            <KPICard
              title="Projeção Anual"
              value={formatCurrency(kpis?.projected_revenue || 0)}
              icon={Wallet}
              subtitle="MRR × 12"
            />
          </>
        )}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Chart */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Distribuição por Plano
          </h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={distribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis 
                  type="category" 
                  dataKey="plan_name" 
                  stroke="hsl(var(--muted-foreground))"
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value} usuários`, 'Quantidade']}
                />
                <Bar dataKey="user_count" radius={[0, 4, 4, 0]}>
                  {distribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Resumo Rápido
          </h3>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <span className="text-muted-foreground">Taxa de Conversão</span>
                <span className="text-xl font-bold text-foreground">
                  {kpis && kpis.total_users > 0 
                    ? ((kpis.active_subs / kpis.total_users) * 100).toFixed(1) 
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <span className="text-muted-foreground">Usuários Free</span>
                <span className="text-xl font-bold text-foreground">
                  {(kpis?.total_users || 0) - (kpis?.active_subs || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <span className="text-muted-foreground">Planos Cadastrados</span>
                <span className="text-xl font-bold text-foreground">
                  {distribution.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
