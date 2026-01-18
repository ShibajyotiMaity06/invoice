'use client';

import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/dashboard/Header';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Users, Clock } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, workspace } = useAuth();

  return (
    <>
      <Header title="Dashboard" />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Welcome message */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Welcome back, {user?.firstName || 'there'}!
          </h2>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your invoices today.
          </p>
        </div>

        {/* Stats */}
        <DashboardStats />

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/invoices/new">
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Create Invoice</CardTitle>
                    <CardDescription>Send a new invoice</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/clients/new">
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="rounded-lg bg-green-500/10 p-2">
                    <Users className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Add Client</CardTitle>
                    <CardDescription>Create a new client</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/time">
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="rounded-lg bg-orange-500/10 p-2">
                    <Clock className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Track Time</CardTitle>
                    <CardDescription>Start a timer</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-center text-muted-foreground">
                No recent activity yet.
                <br />
                Create your first invoice to get started!
              </p>
              <Link href="/invoices/new" className="mt-4">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}