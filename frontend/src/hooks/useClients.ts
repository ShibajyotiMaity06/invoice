'use client';

import { useState, useEffect, useCallback } from 'react';
import { Client, ClientsResponse, Pagination } from '@/types';
import { clientsApi, ClientsQueryParams } from '@/lib/api';
import { useDebounce } from './useDebounce';

interface UseClientsOptions {
  initialPage?: number;
  initialLimit?: number;
}

interface UseClientsReturn {
  clients: Client[];
  pagination: Pagination;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
  refresh: () => void;
}

export function useClients(options: UseClientsOptions = {}): UseClientsReturn {
  const { initialPage = 1, initialLimit = 20 } = options;

  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(initialPage);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: ClientsQueryParams = {
        page,
        limit: initialLimit,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const response = await clientsApi.getAll(params);
      const data = response.data.data as ClientsResponse;

      setClients(data.clients);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch clients');
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, initialLimit]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const refresh = useCallback(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    pagination,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    setPage,
    refresh,
  };
}