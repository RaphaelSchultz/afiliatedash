import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

interface DataRange {
  minDate: string | null;
  maxDate: string | null;
  isLoading: boolean;
}

export function useUserDataRange() {
  const { user } = useAuth();
  const [dataRange, setDataRange] = useState<DataRange>({
    minDate: null,
    maxDate: null,
    isLoading: true,
  });

  useEffect(() => {
    if (!user) {
      setDataRange({ minDate: null, maxDate: null, isLoading: false });
      return;
    }

    const fetchDataRange = async () => {
      try {
        // Fetch the min and max purchase_time for the user
        const { data, error } = await supabase
          .from('shopee_vendas')
          .select('purchase_time')
          .eq('user_id', user.id)
          .order('purchase_time', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error fetching data range:', error);
          setDataRange({ minDate: null, maxDate: null, isLoading: false });
          return;
        }

        if (data && data.length > 0) {
          const maxDate = data[0].purchase_time;
          // Default to last 30 days from the most recent data
          const maxDateObj = new Date(maxDate);
          const minDateObj = subDays(maxDateObj, 30);

          setDataRange({
            minDate: format(minDateObj, 'yyyy-MM-dd'),
            maxDate: format(maxDateObj, 'yyyy-MM-dd'),
            isLoading: false,
          });
        } else {
          setDataRange({ minDate: null, maxDate: null, isLoading: false });
        }
      } catch (err) {
        console.error('Error:', err);
        setDataRange({ minDate: null, maxDate: null, isLoading: false });
      }
    };

    fetchDataRange();
  }, [user]);

  return dataRange;
}
