# Relatório de Análise do Projeto: AfiliateDash_V2.0

## 1. Tecnologias Core
*   **Frontend:** React + Vite + TypeScript.
*   **Estilização:** Tailwind CSS, Shadcn UI (componentes), Lucide React (ícones).
*   **Backend / Dados:** Supabase (Auth, Database, RPCs).
*   **Gerenciamento de Estado:** TanStack Query (Server State), Context API (Auth), URL Search Params (Filtros).
*   **Visualização:** Recharts para gráficos.

## 2. Estrutura e Fluxo
*   **Roteamento:** `react-router-dom` gerenciando rotas públicas (Login, Signup) e protegidas (Dashboard, Analytics, Upload).
*   **Filtros Global:** Hook `useFilters` sincroniza estado de filtros (Datas, Status, Canais, SubIDs) com a URL, permitindo compartilhamento de links com contexto.
*   **Dashboard Principal (`Index.tsx`):** Foca em KPIs de alto nível (GMV, Comissão, Pedidos) calculados via RPCs (`get_dashboard_kpis`) para performance, com gráficos de tendências e distribuição.
*   **Análise do Dia (`DayAnalysis.tsx`):** Ferramenta robusta para cálculo de ROI diário. Permite input manual de investimento (Ads) e cruza com dados de receita para mostrar lucro real. Possui modos de visualização "Agrupada" e "Por SubID".
*   **Admin (`Admin.tsx`):** Área restrita para gestão de usuários e planos.

## 3. Lógica de Negócio e Pontos de Atenção
*   **Cálculos no Servidor:** A maior parte da agregação pesada é feita no Postgres via RPCs para evitar trazer milhares de linhas para o front.
*   **Fuso Horário:** Tratamento explícito para horário do Brasil (UTC-3) nas queries.
*   **Upload CSV:** Parser dedicado para processar relatórios de vendas (Shopee) e inserir no banco.
