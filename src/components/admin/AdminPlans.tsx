import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, GripVertical, Check, X, Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface PlanFeature {
  id: string;
  label: string;
  is_included: boolean;
  order_index: number;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  button_text: string;
  subtitle: string | null;
  is_highlighted: boolean | null;
  order_index: number;
  features?: PlanFeature[];
}

export function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    button_text: '',
    subtitle: '',
    is_highlighted: false,
  });
  const [features, setFeatures] = useState<PlanFeature[]>([]);
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .order('order_index');

      if (plansError) throw plansError;

      // Fetch features for each plan
      const plansWithFeatures = await Promise.all(
        (plansData || []).map(async (plan) => {
          const { data: featuresData } = await supabase
            .from('plan_features')
            .select('*')
            .eq('plan_id', plan.id)
            .order('order_index');

          return {
            ...plan,
            features: featuresData || [],
          };
        })
      );

      setPlans(plansWithFeatures);
    } catch (err: any) {
      console.error('Error fetching plans:', err);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  }

  function openEditDialog(plan: Plan) {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      button_text: plan.button_text,
      subtitle: plan.subtitle || '',
      is_highlighted: plan.is_highlighted || false,
    });
    setFeatures(plan.features || []);
  }

  function openNewDialog() {
    setEditingPlan({ id: 'new' } as Plan);
    setFormData({
      name: '',
      price: 0,
      button_text: 'Assinar',
      subtitle: '',
      is_highlighted: false,
    });
    setFeatures([]);
  }

  async function handleSave() {
    if (!editingPlan) return;

    setSaving(true);
    try {
      if (editingPlan.id === 'new') {
        // Create new plan
        const { data: newPlan, error: planError } = await supabase
          .from('plans')
          .insert({
            name: formData.name,
            price: formData.price,
            button_text: formData.button_text,
            subtitle: formData.subtitle || null,
            is_highlighted: formData.is_highlighted,
            order_index: plans.length,
          })
          .select()
          .single();

        if (planError) throw planError;

        // Create features
        if (features.length > 0 && newPlan) {
          const { error: featuresError } = await supabase
            .from('plan_features')
            .insert(
              features.map((f, index) => ({
                plan_id: newPlan.id,
                label: f.label,
                is_included: f.is_included,
                order_index: index,
              }))
            );

          if (featuresError) throw featuresError;
        }

        toast.success('Plano criado com sucesso!');
      } else {
        // Update existing plan
        const { error: planError } = await supabase
          .from('plans')
          .update({
            name: formData.name,
            price: formData.price,
            button_text: formData.button_text,
            subtitle: formData.subtitle || null,
            is_highlighted: formData.is_highlighted,
          })
          .eq('id', editingPlan.id);

        if (planError) throw planError;

        // Delete old features and insert new ones
        await supabase
          .from('plan_features')
          .delete()
          .eq('plan_id', editingPlan.id);

        if (features.length > 0) {
          const { error: featuresError } = await supabase
            .from('plan_features')
            .insert(
              features.map((f, index) => ({
                plan_id: editingPlan.id,
                label: f.label,
                is_included: f.is_included,
                order_index: index,
              }))
            );

          if (featuresError) throw featuresError;
        }

        toast.success('Plano atualizado com sucesso!');
      }

      setEditingPlan(null);
      fetchPlans();
    } catch (err: any) {
      console.error('Error saving plan:', err);
      toast.error('Erro ao salvar plano');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingPlan) return;

    try {
      // Delete features first
      await supabase
        .from('plan_features')
        .delete()
        .eq('plan_id', deletingPlan.id);

      // Delete plan
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', deletingPlan.id);

      if (error) throw error;

      toast.success('Plano excluído com sucesso!');
      setDeletingPlan(null);
      fetchPlans();
    } catch (err: any) {
      console.error('Error deleting plan:', err);
      toast.error('Erro ao excluir plano');
    }
  }

  function addFeature() {
    if (!newFeature.trim()) return;

    setFeatures([
      ...features,
      {
        id: crypto.randomUUID(),
        label: newFeature.trim(),
        is_included: true,
        order_index: features.length,
      },
    ]);
    setNewFeature('');
  }

  function removeFeature(id: string) {
    setFeatures(features.filter((f) => f.id !== id));
  }

  function toggleFeatureIncluded(id: string) {
    setFeatures(
      features.map((f) =>
        f.id === id ? { ...f, is_included: !f.is_included } : f
      )
    );
  }

  function moveFeature(index: number, direction: 'up' | 'down') {
    const newFeatures = [...features];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= features.length) return;

    [newFeatures[index], newFeatures[newIndex]] = [newFeatures[newIndex], newFeatures[index]];
    setFeatures(newFeatures);
  }

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Gestão de Planos</h2>
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`glass-card rounded-2xl p-6 relative ${
              plan.is_highlighted ? 'ring-2 ring-primary' : ''
            }`}
          >
            {plan.is_highlighted && (
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                Destaque
              </Badge>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                {plan.subtitle && (
                  <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                )}
              </div>

              <div className="text-3xl font-bold text-foreground">
                R$ {plan.price.toFixed(2)}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </div>

              <div className="space-y-2">
                {plan.features?.slice(0, 4).map((feature) => (
                  <div key={feature.id} className="flex items-center gap-2 text-sm">
                    {feature.is_included ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={feature.is_included ? 'text-foreground' : 'text-muted-foreground line-through'}>
                      {feature.label}
                    </span>
                  </div>
                ))}
                {(plan.features?.length || 0) > 4 && (
                  <p className="text-xs text-muted-foreground">
                    +{(plan.features?.length || 0) - 4} features...
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditDialog(plan)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingPlan(plan)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">Nenhum plano cadastrado</p>
          <Button onClick={openNewDialog} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Plano
          </Button>
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan?.id === 'new' ? 'Novo Plano' : 'Editar Plano'}
            </DialogTitle>
            <DialogDescription>
              Configure as informações e features do plano.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Pro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="button_text">Texto do Botão</Label>
                <Input
                  id="button_text"
                  value={formData.button_text}
                  onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                  placeholder="Ex: Assinar Agora"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Ex: Para profissionais"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="highlighted"
                checked={formData.is_highlighted}
                onCheckedChange={(checked) => setFormData({ ...formData, is_highlighted: checked })}
              />
              <Label htmlFor="highlighted">Destacar este plano</Label>
            </div>

            {/* Features Section */}
            <div className="space-y-3">
              <Label>Features do Plano</Label>
              
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Adicionar feature..."
                  onKeyDown={(e) => e.key === 'Enter' && addFeature()}
                />
                <Button type="button" onClick={addFeature} variant="secondary">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {features.map((feature, index) => (
                  <div
                    key={feature.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50"
                  >
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveFeature(index, 'up')}
                        disabled={index === 0}
                        className="p-0.5 hover:bg-secondary rounded disabled:opacity-30"
                      >
                        <GripVertical className="h-3 w-3" />
                      </button>
                    </div>
                    
                    <Switch
                      checked={feature.is_included}
                      onCheckedChange={() => toggleFeatureIncluded(feature.id)}
                    />
                    
                    <span className={`flex-1 text-sm ${!feature.is_included ? 'text-muted-foreground line-through' : ''}`}>
                      {feature.label}
                    </span>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeFeature(feature.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlan(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPlan} onOpenChange={() => setDeletingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Plano</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o plano "{deletingPlan?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
