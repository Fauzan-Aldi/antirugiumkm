import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePos } from './PosContext';

export function useSubscriptionGuard() {
  const { account } = usePos();
  const navigate = useNavigate();

  const expiryDate = account?.subscriptionExpiresAt ? new Date(account.subscriptionExpiresAt) : null;
  const isExpired = expiryDate ? expiryDate.getTime() <= Date.now() : false;
  const isAdmin = account?.isAdmin ?? false;

  useEffect(() => {
    if (isExpired && !isAdmin) {
      // Redirect to settings page where user can see expired status and contact CS
      navigate('/kasir/settings', { replace: true });
    }
  }, [isExpired, isAdmin, navigate]);

  return { isExpired, isAdmin, daysLeft: expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0 };
}
