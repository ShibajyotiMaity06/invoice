'use client';

import { useState, useEffect } from 'react';
import { Client } from '@/types';
import { clientsApi } from '@/lib/api';

interface UseClientReturn {
    client: Client | null;
    isLoading: boolean;
    error: string | null;
    refresh: () => void;
}

export function useClient(id: string): UseClientReturn {
    const [client, setClient] = useState<Client | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchClient = async () => {
        if (!id) {
            setError('Client ID is required');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await clientsApi.getOne(id);
            setClient(response.data.data.client);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch client');
            setClient(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClient();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const refresh = () => {
        fetchClient();
    };

    return {
        client,
        isLoading,
        error,
        refresh,
    };
}
