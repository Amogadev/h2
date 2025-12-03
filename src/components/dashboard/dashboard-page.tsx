"use client";

import React, { useState, useMemo } from 'react';
import type { Room, Booking, Payment } from '@/lib/types';
import { formatISO, startOfDay } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import DashboardHeader from '@/components/dashboard/header';
import SummaryCards from '@/components/dashboard/summary-cards';
import CalendarSection from '@/components/dashboard/calendar-section';
import RoomSection from '@/components/dashboard/room-section';
import PaymentsSection from '@/components/dashboard/payments-section';

interface DashboardPageProps {
  initialRooms: Room[];
  initialBookings: Booking[];
  initialPayments: Payment[];
}

export function DashboardPage({
  initialRooms,
  initialBookings,
  initialPayments,
}: DashboardPageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));

  // In a real app with client-side auth, you might redirect.
  // Since we are simulating auth, we'll just show a loading state.
  // React.useEffect(() => {
  //   if (!loading && !user) {
  //     router.replace('/login');
  //   }
  // }, [user, loading, router]);

  const filteredData = useMemo(() => {
    const dateStr = formatISO(selectedDate, { representation: 'date' });
    const bookingsForDay = initialBookings.filter(b => formatISO(new Date(b.date), { representation: 'date' }) === dateStr);
    const paymentsForDay = initialPayments.filter(p => formatISO(new Date(p.date), { representation: 'date' }) === dateStr);

    const updatedRooms = initialRooms.map(room => {
        const currentBooking = initialBookings.find(b => {
            const checkInDate = startOfDay(new Date(b.checkIn));
            const checkOutDate = startOfDay(new Date(b.checkOut));
            return b.roomNumber === room.roomNumber && selectedDate >= checkInDate && selectedDate < checkOutDate;
        });

        if (currentBooking) {
            return {
                ...room,
                status: 'Occupied' as const,
                guestName: currentBooking.guestName,
                checkIn: currentBooking.checkIn,
                checkOut: currentBooking.checkOut,
            };
        }
        return { ...room, status: 'Available' as const };
    });

    return { bookingsForDay, paymentsForDay, updatedRooms };
  }, [selectedDate, initialBookings, initialPayments, initialRooms]);


  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="flex items-center h-16 px-4 border-b shrink-0 md:px-6 justify-between">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-8 w-8 rounded-full" />
        </header>
        <main className="flex-1 p-4 space-y-6 md:p-8">
            <Skeleton className="h-10 w-64 mb-4" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-96 lg:col-span-1" />
                <Skeleton className="h-96 lg:col-span-2" />
            </div>
             <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
            </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DashboardHeader />
      <main className="flex-1 p-4 space-y-8 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <div className="w-full sm:w-auto">
                <CalendarSection
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                bookings={[]} // We pass an empty array as we are using it just as a date picker here.
                isDatePickerOnly={true}
                />
            </div>
        </div>
        <SummaryCards rooms={filteredData.updatedRooms} />
        
        <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <RoomSection rooms={filteredData.updatedRooms} bookings={initialBookings} />
            </div>
            <div className="lg:col-span-1">
                <PaymentsSection
                    payments={filteredData.paymentsForDay}
                    bookings={filteredData.bookingsForDay}
                />
            </div>
        </div>

      </main>
    </div>
  );
}
