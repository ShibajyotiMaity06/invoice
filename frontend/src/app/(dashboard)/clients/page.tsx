'use client';

import { Header } from '@/components/dashboard/Header';
import { ClientList } from '@/components/clients/ClientList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useClients } from '@/hooks/useClients';
import { Plus, Users } from 'lucide-react';
import Link from 'next/link';

export default function ClientsPage() {
  const {
    clients,
    pagination,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    setPage,
    refresh,
  } = useClients();

  return (
    <>
      <Header title="Clients" />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Header with actions */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Clients</h2>
            <p className="text-muted-foreground">
              Manage your clients and their billing information
            </p>
          </div>
          <Link href="/clients/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </Link>
        </div>

        {/* Error state */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" className="mt-2" onClick={refresh}>
                Try again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty state for first-time users */}
        {!isLoading && clients.length === 0 && !searchQuery && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No clients yet</h3>
              <p className="mt-2 text-center text-muted-foreground">
                Get started by adding your first client.
                <br />
                You&apos;ll be able to create invoices for them.
              </p>
              <Link href="/clients/new" className="mt-4">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Client
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Client list */}
        {(clients.length > 0 || searchQuery) && (
          <ClientList
            clients={clients}
            pagination={pagination}
            onSearch={setSearchQuery}
            onPageChange={setPage}
            onRefresh={refresh}
            isLoading={isLoading}
            searchQuery={searchQuery}
          />
        )}
      </main>
    </>
  );
}