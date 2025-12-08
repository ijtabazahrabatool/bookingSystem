import { useMemo } from 'react';

/**
 * A custom hook to extract the provider ID from a service object.
 * @param {object} service - The service object.
 * @returns {string|null} The provider ID or null if not found.
 */
export function useProviderId(service) {
  const providerId = useMemo(() => {
    return service?.providerId?._id || service?.providerId?.id || service?.providerId || null;
  }, [service]);

  return providerId;
}
