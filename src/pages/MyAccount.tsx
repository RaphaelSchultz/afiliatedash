import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersonalDataTab } from '@/components/my-account/PersonalDataTab';
import { APIsTab } from '@/components/my-account/APIsTab';
import { SecurityTab } from '@/components/my-account/SecurityTab';
import { MyPlanTab } from '@/components/my-account/MyPlanTab';

export default function MyAccount() {
  const [activeTab, setActiveTab] = useState('personal');

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold text-foreground">Minha Conta</h1>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up" style={{ animationDelay: '50ms' }}>
          <TabsList className="w-full grid grid-cols-4 bg-secondary/50 border border-border rounded-full p-1 h-auto">
            <TabsTrigger 
              value="personal" 
              className="rounded-full py-2.5 text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger 
              value="apis" 
              className="rounded-full py-2.5 text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              APIs
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="rounded-full py-2.5 text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Segurança
            </TabsTrigger>
            <TabsTrigger 
              value="plan" 
              className="rounded-full py-2.5 text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Meu Plano
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="personal" className="m-0">
              <PersonalDataTab />
            </TabsContent>
            <TabsContent value="apis" className="m-0">
              <APIsTab />
            </TabsContent>
            <TabsContent value="security" className="m-0">
              <SecurityTab />
            </TabsContent>
            <TabsContent value="plan" className="m-0">
              <MyPlanTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
