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

  useEffect(() => {
    // This check ensures seeding only happens once in a controlled way,
    // preferably triggered by an explicit action in a real app.
    // For now, it runs once if NODE_ENV is development.
    if (process.env.NODE_ENV === 'development') {
      const hasSeeded = sessionStorage.getItem('hasSeeded');
      if (!hasSeeded) {
        seedInitialData();
        sessionStorage.setItem('hasSeeded', 'true');
      }
    }
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
