
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { Room, Booking, Payment } from '@/lib/types';
import { formatISO, startOfDay, endOfDay, isFuture, isToday } from 'date-fns';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import DashboardHeader from '@/components/dashboard/header';
import SummaryCards from '@/components/dashboard/summary-cards';
import RoomSection from '@/components/dashboard/room-section';
import PaymentsSection from '@/components/dashboard/payments-section';
import { collection, query, onSnapshot, getFirestore, collectionGroup, Timestamp } from 'firebase/firestore';
import CalendarSection from './calendar-section';

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
    const startOfSelectedDate = startOfDay(selectedDate);
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
        const bookingForRoom = (bookings || []).find(b => {
            const checkInDate = startOfDay(b.checkIn instanceof Timestamp ? b.checkIn.toDate() : new Date(b.checkIn as string));
            const checkOutDate = endOfDay(b.checkOut instanceof Timestamp ? b.checkOut.toDate() : new Date(b.checkOut as string));
            return b.roomNumber.toString() === room.roomNumber.toString() && startOfSelectedDate >= checkInDate && startOfSelectedDate <= checkOutDate;
        });

        if (bookingForRoom) {
            const checkInDate = startOfDay(bookingForRoom.checkIn instanceof Timestamp ? bookingForRoom.checkIn.toDate() : new Date(bookingForRoom.checkIn as string));
            
            let status: Room['status'] = 'Available';
            if (startOfSelectedDate >= checkInDate) {
              status = 'Occupied';
            } else {
              status = 'Booked';
            }

            // If we are looking at today, but the check-in is in the future, it's 'Booked', not 'Occupied'
            if (isToday(startOfSelectedDate) && isFuture(checkInDate)) {
                 status = 'Booked';
            }
             // if selected date is in the future and there is a booking, it's 'Booked'
            if (isFuture(startOfSelectedDate)) {
                status = 'Booked';
            }

            // A room is only 'Occupied' if the selected date falls within the booking period.
            if(startOfSelectedDate >= checkInDate && startOfSelectedDate <= endOfDay(bookingForRoom.checkOut instanceof Timestamp ? bookingForRoom.checkOut.toDate() : new Date(bookingForRoom.checkOut as string))) {
                status = 'Occupied';
            } else {
                // If there's a booking but not for today, it might be available or booked for another day.
                // We need to check if there are ANY future bookings for this room.
                 const futureBooking = (bookings || []).find(b => 
                    b.roomNumber.toString() === room.roomNumber.toString() && 
                    isFuture(startOfDay(b.checkIn instanceof Timestamp ? b.checkIn.toDate() : new Date(b.checkIn as string)))
                );
                if (futureBooking && startOfSelectedDate < startOfDay(futureBooking.checkIn instanceof Timestamp ? futureBooking.checkIn.toDate() : new Date(futureBooking.checkIn as string))) {
                    status = 'Booked'
                } else {
                    status = 'Available'
                }
            }


            return {
                ...room,
                status: status,
                guestName: bookingForRoom.guestName,
                checkIn: bookingForRoom.checkIn,
                checkOut: bookingForRoom.checkOut,
                currentBooking: bookingForRoom,
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
        <SummaryCards rooms={filteredData.updatedRooms} />
        
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
