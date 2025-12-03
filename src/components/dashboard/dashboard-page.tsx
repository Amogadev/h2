"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { Room, Booking, Payment } from '@/lib/types';
import { formatISO, startOfDay } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import DashboardHeader from '@/components/dashboard/header';
import SummaryCards from '@/components/dashboard/summary-cards';
import RoomSection from '@/components/dashboard/room-section';
import PaymentsSection from '@/components/dashboard/payments-section';
import { collection, query, onSnapshot, getFirestore } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import CalendarSection from './calendar-section';

export function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    setDataLoading(true);
    const roomsQuery = query(collection(db, 'rooms'));
    
    const unsubscribeRooms = onSnapshot(roomsQuery, snapshot => {
      const fetchedRooms: Room[] = [];
      const bookingPromises: Promise<Booking[]>[] = [];
      const paymentPromises: Promise<Payment[]>[] = [];

      snapshot.forEach(doc => {
        fetchedRooms.push({ id: doc.id, ...doc.data() } as Room);
        
        const bookingsCol = collection(db, `rooms/${doc.id}/bookings`);
        bookingPromises.push(new Promise(resolve => {
            onSnapshot(bookingsCol, bookSnap => {
                resolve(bookSnap.docs.map(d => ({id: d.id, ...d.data()} as Booking)))
            })
        }));
        
        const paymentsCol = collection(db, `rooms/${doc.id}/payments`);
        paymentPromises.push(new Promise(resolve => {
            onSnapshot(paymentsCol, paySnap => {
                resolve(paySnap.docs.map(d => ({id: d.id, ...d.data()} as Payment)))
            })
        }));
      });
      
      setRooms(fetchedRooms);

      Promise.all(bookingPromises).then(bookingArrays => {
        setBookings(bookingArrays.flat());
      });
      Promise.all(paymentPromises).then(paymentArrays => {
        setPayments(paymentArrays.flat());
      });
      setDataLoading(false);
    });

    return () => unsubscribeRooms();
  }, []);

  const filteredData = useMemo(() => {
    const dateStr = formatISO(selectedDate, { representation: 'date' });
    
    const bookingsForDay = bookings.filter(b => {
        const bookingDate = new Date(b.date);
        return formatISO(bookingDate, { representation: 'date' }) === dateStr;
    });

    const paymentsForDay = payments.filter(p => {
        const paymentDate = new Date(p.date);
        return formatISO(paymentDate, { representation: 'date' }) === dateStr;
    });

    const updatedRooms = rooms.map(room => {
        const currentBooking = bookings.find(b => {
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
        return { ...room, status: 'Available' as const, guestName: undefined, checkIn: undefined, checkOut: undefined };
    });

    return { bookingsForDay, paymentsForDay, updatedRooms };
  }, [selectedDate, bookings, payments, rooms]);


  if (loading || dataLoading) {
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
                bookings={[]} 
                isDatePickerOnly={true}
                />
            </div>
        </div>
        <SummaryCards rooms={filteredData.updatedRooms} />
        
        <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <RoomSection rooms={filteredData.updatedRooms} bookings={bookings} />
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
