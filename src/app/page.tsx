"use client"
import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { seedInitialData } from '@/lib/data';

export default function Home() {
  const { user, isUserLoading: loading } = useUser();

  useEffect(() => {
    if (!loading && !user) {
      redirect('/login');
    }
  }, [user, loading]);

  // Seed data on initial load if needed
  useEffect(() => {
    seedInitialData();
  }, []);


  if (loading || !user) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Loading...</p>
        </div>
    )
  }


  return (
    <DashboardPage />
  );
}
