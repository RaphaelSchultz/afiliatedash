import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useAdminAuth() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAdminRole() {
      if (authLoading) return;
      
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('is_admin');

        if (error) {
          console.error('Error checking admin status:', error);
          navigate('/');
          return;
        }

        if (!data) {
          navigate('/');
          return;
        }

        setIsAdmin(true);
      } catch (err) {
        console.error('Admin check failed:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    }

    checkAdminRole();
  }, [user, authLoading, navigate]);

  return { isAdmin, loading: loading || authLoading };
}
