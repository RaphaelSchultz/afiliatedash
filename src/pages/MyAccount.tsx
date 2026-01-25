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
          <TabsList className="w-full grid grid-cols-4 bg-secondary/50 border border-border rounded-full p-1.5 h-auto">
            <TabsTrigger 
              value="personal" 
              className="rounded-full py-2.5 text-sm font-medium transition-all duration-200 data-[state=active]:gradient-shopee data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-shopee-orange/20"
            >
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger 
              value="apis" 
              className="rounded-full py-2.5 text-sm font-medium transition-all duration-200 data-[state=active]:gradient-shopee data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-shopee-orange/20"
            >
              APIs
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="rounded-full py-2.5 text-sm font-medium transition-all duration-200 data-[state=active]:gradient-shopee data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-shopee-orange/20"
            >
              Segurança
            </TabsTrigger>
            <TabsTrigger 
              value="plan" 
              className="rounded-full py-2.5 text-sm font-medium transition-all duration-200 data-[state=active]:gradient-shopee data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-shopee-orange/20"
            >
              Meu Plano
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="personal" className="m-0 animate-fade-in data-[state=inactive]:animate-fade-out">
              <PersonalDataTab />
            </TabsContent>
            <TabsContent value="apis" className="m-0 animate-fade-in data-[state=inactive]:animate-fade-out">
              <APIsTab />
            </TabsContent>
            <TabsContent value="security" className="m-0 animate-fade-in data-[state=inactive]:animate-fade-out">
              <SecurityTab />
            </TabsContent>
            <TabsContent value="plan" className="m-0 animate-fade-in data-[state=inactive]:animate-fade-out">
              <MyPlanTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
