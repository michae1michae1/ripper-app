import { useNavigate } from 'react-router-dom';
import { PasswordKeypad } from '@/components/ui';

export const AdminNewEventPage = () => {
  const navigate = useNavigate();

  const handlePasswordSuccess = () => {
    // Auth is set in sessionStorage by the PasswordKeypad
    navigate('/new');
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <PasswordKeypad
      onSuccess={handlePasswordSuccess}
      onGoBack={handleGoBack}
      showGoBack={true}
    />
  );
};

