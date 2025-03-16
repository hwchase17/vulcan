import { useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';

export function Thread() {
  const { session } = useUser();

  useEffect(() => {
    if (!session?.access_token) return;

    // Commented out unused client creation
    // const client = createLanggraphClient(session.access_token);
    // Use the authenticated client to make API calls
    // Example:
    // client.someApiCall().then(setData);
  }, [session]);

  return (
    <div>
      {/* Your thread component UI */}
    </div>
  );
} 