import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Shield, Ban, Eye, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string | null;
  avatar_url: string | null;
  plan_type: string;
  subscription_active: boolean;
  subscription_started: string | null;
  subscription_expires: string | null;
  is_admin: boolean;
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const { data, error } = await supabase.rpc('get_admin_stats');

      if (error) throw error;

      const statsData = data as unknown as { users: AdminUser[] };
      setUsers(statsData.users || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }

  async function toggleAdminRole(userId: string, currentIsAdmin: boolean) {
    try {
      if (currentIsAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;
        toast.success('Permissão de admin removida');
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });

        if (error) throw error;
        toast.success('Permissão de admin adicionada');
      }

      // Refresh users list
      fetchUsers();
    } catch (err: any) {
      console.error('Error toggling admin:', err);
      toast.error('Erro ao alterar permissão');
    }
  }

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.full_name?.toLowerCase().includes(searchLower)
    );
  });

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="glass-card rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por email ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {user.full_name || 'Sem nome'}
                          </p>
                          {user.is_admin && (
                            <Badge variant="outline" className="text-xs border-primary text-primary">
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.plan_type}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.subscription_active ? (
                      <div className="flex items-center gap-1.5 text-success">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Ativo</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">Inativo</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {user.created_at
                      ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedUser(user)}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleAdminRole(user.id, user.is_admin)}
                        title={user.is_admin ? 'Remover admin' : 'Tornar admin'}
                      >
                        <Shield className={`h-4 w-4 ${user.is_admin ? 'text-primary' : ''}`} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Informações completas do usuário selecionado.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {getInitials(selectedUser.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.full_name || 'Sem nome'}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Plano Atual</p>
                  <p className="font-medium">{selectedUser.plan_type}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">
                    {selectedUser.subscription_active ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Data de Cadastro</p>
                  <p className="font-medium">
                    {selectedUser.created_at
                      ? format(new Date(selectedUser.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      : '-'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Assinatura até</p>
                  <p className="font-medium">
                    {selectedUser.subscription_expires
                      ? format(new Date(selectedUser.subscription_expires), "dd/MM/yyyy", { locale: ptBR })
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant={selectedUser.is_admin ? 'destructive' : 'default'}
                  onClick={() => {
                    toggleAdminRole(selectedUser.id, selectedUser.is_admin);
                    setSelectedUser(null);
                  }}
                  className="flex-1"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {selectedUser.is_admin ? 'Remover Admin' : 'Tornar Admin'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
