import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'react-router-dom';

export function AuthCallback() {
  const { handleEmailVerification } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if this is an email verification callback
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');
    
    // If we have tokens and type is signup, this is likely an email verification
    if (accessToken && refreshToken && type === 'signup') {
      handleEmailVerification();
    }
  }, [searchParams, handleEmailVerification]);

  return null; // This component doesn't render anything
}
