
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { Room, Booking, Payment } from '@/lib/types';
import { formatISO, startOfDay, endOfDay, isFuture, isToday, isWithinInterval } from 'date-fns';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import DashboardHeader from '@/components/dashboard/header';
import SummaryCards from '@/components/dashboard/summary-cards';
import RoomSection from '@/components/dashboard/room-section';
import PaymentsSection from '@/components/dashboard/payments-section';
import { collection, query, onSnapshot, getFirestore, collectionGroup, Timestamp } from 'firebase/firestore';
import CalendarSection from './calendar-section';
import { FutureBookingsDialog } from './future-bookings-dialog';

export function DashboardPage() {
  const { user, isUserLoading: loading } = useUser();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  
  const firestore = useFirestore();

  const roomsQuery = useMemoFirebase(() => firestore && query(collection(firestore, 'rooms')), [firestore]);
  const { data: rooms, isLoading: roomsLoading } = useCollection<Room>(roomsQuery);

  const bookingsQuery = useMemoFirebase(() => firestore && query(collectionGroup(firestore, 'bookings')), [firestore]);
  const { data: bookings, isLoading: bookingsLoading } = useCollection<Booking>(bookingsQuery);

  const paymentsQuery = useMemoFirebase(() => firestore && query(collectionGroup(firestore, 'payments')), [firestore]);
  const { data: payments, isLoading: paymentsLoading } = useCollection<Payment>(paymentsQuery);
  
  const dataLoading = roomsLoading || bookingsLoading || paymentsLoading;

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);


  const filteredData = useMemo(() => {
    const startOfSelectedDay = startOfDay(selectedDate);
    const dateStr = formatISO(selectedDate, { representation: 'date' });
    
    const bookingsForDay = (bookings || []).filter(b => {
        const bookingDate = b.date instanceof Timestamp ? b.date.toDate() : new Date(b.date as string);
        return formatISO(bookingDate, { representation: 'date' }) === dateStr;
    });

    const paymentsForDay = (payments || []).filter(p => {
        const paymentDate = p.date instanceof Timestamp ? p.date.toDate() : new Date(p.date as string);
        return formatISO(paymentDate, { representation: 'date' }) === dateStr;
    });

    const uniqueRooms = (rooms || [])
      .filter((room, index, self) => 
        index === self.findIndex((r) => r.roomNumber === room.roomNumber)
      )
      .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));


      const updatedRooms = uniqueRooms.map(room => {
        // Find the most relevant booking for this room that hasn't ended yet.
        // We sort to get the soonest booking if there are multiple.
        const relevantBooking = (bookings || [])
            .filter(b => {
                if (b.roomNumber.toString() !== room.roomNumber.toString()) return false;
                const checkOut = endOfDay(b.checkOut instanceof Timestamp ? b.checkOut.toDate() : new Date(b.checkOut as string));
                return checkOut >= startOfSelectedDay;
            })
            .sort((a, b) => {
                const aCheckIn = a.checkIn instanceof Timestamp ? a.checkIn.toDate() : new Date(a.checkIn as string);
                const bCheckIn = b.checkIn instanceof Timestamp ? b.checkIn.toDate() : new Date(b.checkIn as string);
                return aCheckIn.getTime() - bCheckIn.getTime();
            })[0]; // Get the earliest upcoming or current booking

        if (relevantBooking) {
            const checkIn = startOfDay(relevantBooking.checkIn instanceof Timestamp ? relevantBooking.checkIn.toDate() : new Date(relevantBooking.checkIn as string));
            const checkOut = endOfDay(relevantBooking.checkOut instanceof Timestamp ? relevantBooking.checkOut.toDate() : new Date(relevantBooking.checkOut as string));
            
            let status: Room['status'];
            
            // isWithinInterval checks if startOfSelectedDay is between checkIn and checkOut (inclusive)
            if (isWithinInterval(startOfSelectedDay, { start: checkIn, end: checkOut })) {
                status = 'Occupied';
            } else if (startOfSelectedDay < checkIn) {
                status = 'Booked';
            } else {
                status = 'Available'; 
            }
            
            // If the booking is in the past and we are here, it means the room is now available
            if (status === 'Available') {
                 return { ...room, status: 'Available' as const, guestName: undefined, checkIn: undefined, checkOut: undefined };
            }

            return {
                ...room,
                status: status,
                guestName: relevantBooking.guestName,
                checkIn: relevantBooking.checkIn,
                checkOut: relevantBooking.checkOut,
                currentBooking: relevantBooking,
            };
        }
        
        // No relevant (current or future) bookings found for this room.
        return { ...room, status: 'Available' as const, guestName: undefined, checkIn: undefined, checkOut: undefined };
    });
    
    const today = startOfDay(new Date());
    const futureBookings = (bookings || []).filter(b => {
        const checkInDate = b.checkIn instanceof Timestamp ? b.checkIn.toDate() : new Date(b.checkIn as string);
        return checkInDate > today;
    });

    const futureBookingsWithPayments = futureBookings.map(booking => {
        const payment = (payments || []).find(p => p.bookingId === booking.id);
        return { ...booking, payment };
    });

    return { bookingsForDay, paymentsForDay, updatedRooms, futureBookingsWithPayments };
  }, [selectedDate, bookings, payments, rooms]);


  if (loading || dataLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="flex items-center h-16 px-4 border-b shrink-0 md:px-6 justify-between">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-8 w-8 rounded-full" />
        </header>
        <main className="flex-1 p-4 space-y-6 md:p-8">
            
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
          <div>
            
            <p className="text-xl text-muted-foreground">Where Every Stay is a Story. 📖</p>
          </div>
          <div className="w-full sm:w-auto">
              <CalendarSection
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              bookings={filteredData.bookingsForDay}
              isDatePickerOnly={true}
              />
          </div>
        </div>
        <SummaryCards rooms={filteredData.updatedRooms}>
             <FutureBookingsDialog bookings={filteredData.futureBookingsWithPayments} />
        </SummaryCards>
        
        <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <RoomSection rooms={filteredData.updatedRooms} />
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
