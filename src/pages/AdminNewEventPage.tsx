import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PasswordKeypad, isHostAuthenticated } from '@/components/ui';

export const AdminNewEventPage = () => {
  const navigate = useNavigate();

  // If already authenticated, skip to new event page
  useEffect(() => {
    if (isHostAuthenticated()) {
      navigate('/new', { replace: true });
    }
  }, [navigate]);

  const handlePasswordSuccess = () => {
    // Auth is set in sessionStorage by the PasswordKeypad
    navigate('/new');
  };

  const handleGoBack = () => {
    navigate('/');
  };

  // If already authenticated, don't render keypad (will redirect in useEffect)
  if (isHostAuthenticated()) {
    return null;
  }

  return (
    <div data-page="AdminNewEventPage" className="admin-new-event-page">
      <PasswordKeypad
        onSuccess={handlePasswordSuccess}
        onGoBack={handleGoBack}
        showGoBack={true}
      />
    </div>
  );
};

