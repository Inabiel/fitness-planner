import { useEffect, useState } from 'react';
import { localDate } from '../domain';

export function useLocalToday(): string {
  const [today, setToday] = useState(localDate);

  useEffect(() => {
    const refresh = () => setToday(localDate());
    document.addEventListener('visibilitychange', refresh);
    const interval = window.setInterval(refresh, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.clearInterval(interval);
    };
  }, []);

  return today;
}
