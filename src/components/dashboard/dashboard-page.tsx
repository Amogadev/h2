
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { Room, Booking, Payment } from '@/lib/types';
import { startOfDay, endOfDay, isWithinInterval, isAfter, isToday, isBefore } from 'date-fns';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import DashboardHeader from '@/components/dashboard/header';
import RoomSection from '@/components/dashboard/room-section';
import PaymentsSection from '@/components/dashboard/payments-section';
import { collection, query, collectionGroup, Timestamp } from 'firebase/firestore';
import CalendarSection from './calendar-section';
import { RoomDetailsDialog } from './room-details-dialog';

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
  
  const [futureBookingsWithPayments, setFutureBookingsWithPayments] = useState<(Booking & { payment?: Payment; })[]>([]);


  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (bookings && payments) {
        const today = startOfDay(new Date());
        const futureBookings = (bookings || []).filter(b => {
            const checkInDate = startOfDay(b.checkIn instanceof Timestamp ? b.checkIn.toDate() : new Date(b.checkIn as string));
            return isAfter(checkInDate, today);
        });

        const futureBookingsWithPaymentsData = futureBookings.map(booking => {
            const bookingCheckInDate = (booking.checkIn instanceof Timestamp ? booking.checkIn.toDate() : new Date(booking.checkIn as string)).toISOString().split('T')[0];
            const payment = (payments || []).find(p => {
                if (!p.roomNumber) return false;
                const paymentDate = (p.date instanceof Timestamp ? p.date.toDate() : new Date(p.date as string)).toISOString().split('T')[0];
                return p.roomNumber.toString() === booking.roomNumber.toString() && paymentDate === bookingCheckInDate;
            });
            return { ...booking, payment };
        });

        setFutureBookingsWithPayments(futureBookingsWithPaymentsData);
    }
  }, [bookings, payments]);


  const filteredData = useMemo(() => {
    const startOfSelectedDay = startOfDay(selectedDate);
    
    const bookingsForDay = (bookings || []).filter(b => {
        const checkIn = startOfDay(b.checkIn instanceof Timestamp ? b.checkIn.toDate() : new Date(b.checkIn as string));
        const checkOut = endOfDay(b.checkOut instanceof Timestamp ? b.checkOut.toDate() : new Date(b.checkOut as string));
        return isWithinInterval(startOfSelectedDay, { start: checkIn, end: checkOut });
    });

    const paymentsForDay = (payments || []).filter(p => {
        if (!p.date) return false;
        const paymentDate = p.date instanceof Timestamp ? p.date.toDate() : new Date(p.date as string);
        return paymentDate >= startOfSelectedDay && paymentDate <= endOfDay(selectedDate);
    });

    const uniqueRooms = (rooms || [])
      .filter((room, index, self) => 
        index === self.findIndex((r) => r.roomNumber === room.roomNumber)
      )
      .sort((a, b) => {
        const roomNumA = parseInt(a.roomNumber, 10);
        const roomNumB = parseInt(b.roomNumber, 10);
        return roomNumA - roomNumB;
      });


    const updatedRooms = uniqueRooms.map(room => {
        const allBookingsForRoom = (bookings || [])
            .filter(b => b.roomNumber.toString() === room.roomNumber.toString())
            .sort((a, b) => {
                const aCheckIn = a.checkIn instanceof Timestamp ? a.checkIn.toDate() : new Date(a.checkIn as string);
                const bCheckIn = b.checkIn instanceof Timestamp ? b.checkIn.toDate() : new Date(b.checkIn as string);
                return aCheckIn.getTime() - bCheckIn.getTime();
            });

        // Find if there is an active booking for the selected date
        const activeBooking = allBookingsForRoom.find(b => {
            const checkIn = startOfDay(b.checkIn instanceof Timestamp ? b.checkIn.toDate() : new Date(b.checkIn as string));
            const checkOut = endOfDay(b.checkOut instanceof Timestamp ? b.checkOut.toDate() : new Date(b.checkOut as string));
            const isSelectedTodayOrLater = !isBefore(startOfSelectedDay, startOfDay(new Date()));
            
            const isSelectedDateInBooking = isWithinInterval(startOfSelectedDay, { start: checkIn, end: checkOut });

            return isSelectedDateInBooking || (isToday(checkIn) && isSelectedTodayOrLater);
        });
        
        if (activeBooking) {
            const checkInDate = startOfDay(activeBooking.checkIn instanceof Timestamp ? activeBooking.checkIn.toDate() : new Date(activeBooking.checkIn as string));
            if (isAfter(checkInDate, startOfSelectedDay)) {
                 return {
                    ...room,
                    status: 'Available' as const, // Still available today
                    futureBooking: activeBooking 
                };
            }
            return {
                ...room,
                status: 'Occupied' as const,
                guestName: activeBooking.guestName,
                checkIn: activeBooking.checkIn,
                checkOut: activeBooking.checkOut,
                currentBooking: activeBooking,
            };
        }
        
        // If no active booking, check for the next future booking
        const futureBooking = allBookingsForRoom.find(b => {
            const checkIn = startOfDay(b.checkIn instanceof Timestamp ? b.checkIn.toDate() : new Date(b.checkIn as string));
            return isAfter(checkIn, startOfSelectedDay);
        });

        if (futureBooking) {
             return {
                ...room,
                status: 'Available' as const, // Still available today
                futureBooking: futureBooking 
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
        
        <RoomDetailsDialog
          rooms={filteredData.updatedRooms}
          futureBookings={futureBookingsWithPayments}
        />

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
