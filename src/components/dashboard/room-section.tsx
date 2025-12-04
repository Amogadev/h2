
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DoorClosed, DoorOpen, User, CalendarClock } from 'lucide-react';
import type { Room, Booking } from '@/lib/types';
import { BookingDialog } from './booking-dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import { ViewBookingDialog } from './view-booking-dialog';

interface RoomSectionProps {
  rooms: (Room & { currentBooking?: Booking, futureBooking?: Booking })[];
}

const RoomCard = ({ room }: { room: Room & { currentBooking?: Booking, futureBooking?: Booking }}) => {
  const isAvailable = room.status === 'Available';
  const isOccupied = room.status === 'Occupied';
  const hasFutureBooking = !!room.futureBooking;

  const formatDate = (date: string | Timestamp | undefined) => {
    if (!date) return 'No booking info';
    if (date instanceof Timestamp) {
      return format(date.toDate(), 'MMM d');
    }
    return format(new Date(date as string), 'MMM d');
  }

  const getStatusIcon = (status: Room['status'] | 'Booked') => {
    switch(status) {
      case 'Available':
        return <DoorOpen className="w-4 h-4 mr-1" />;
      case 'Occupied':
        return <DoorClosed className="w-4 h-4 mr-1" />;
      case 'Booked':
        return <CalendarClock className="w-4 h-4 mr-1" />;
      default:
        return <DoorOpen className="w-4 h-4 mr-1" />;
    }
  }

  return (
    <Card className={cn("flex flex-col", {
      'bg-card': isAvailable && !hasFutureBooking,
      'bg-green-900/50 border-green-700': isOccupied,
      // For available rooms with a future booking, we don't apply special background.
      // The 'Booked' badge will provide the visual cue.
    })}>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Room {room.roomNumber}</CardTitle>
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge 
               variant={isOccupied ? 'default' : 'secondary'} 
               className={cn({
                 'bg-green-600 hover:bg-green-700 text-white': isOccupied,
                 'bg-secondary hover:bg-secondary/80': isAvailable
               })}
            >
              {getStatusIcon(room.status)}
              {room.status}
            </Badge>
            {isAvailable && hasFutureBooking && (
                <Badge
                    variant="outline"
                    className="border-orange-500 text-orange-500"
                >
                    {getStatusIcon('Booked')}
                    Booked
                </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow">
        {(isOccupied || (isAvailable && hasFutureBooking)) ? (
            <div className="space-y-2 text-sm">
                <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>
                    {isOccupied ? room.currentBooking?.guestName : room.futureBooking?.guestName}
                </span>
                </div>
                <p className='text-xs text-muted-foreground'>
                    {isOccupied ? 
                        `Check-in: ${formatDate(room.checkIn)} | Check-out: ${formatDate(room.checkOut)}` :
                        `Next: ${formatDate(room.futureBooking?.checkIn)} - ${formatDate(room.futureBooking?.checkOut)}`
                    }
                </p>
            </div>
        ) : (
             <div className="flex flex-col items-center justify-center flex-grow text-center text-muted-foreground">
                <DoorOpen className="w-12 h-12 mb-2" />
                <p>Ready for booking</p>
            </div>
        )}
        <div className="mt-4">
          {isOccupied && room.currentBooking ? (
             <ViewBookingDialog booking={room.currentBooking}>
                <Button variant="outline" className="w-full">View Booking</Button>
             </ViewBookingDialog>
          ) : (
            <BookingDialog room={room}>
              <Button className="w-full">Book Now</Button>
            </BookingDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
};


const RoomSection = ({ rooms }: RoomSectionProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Room Status</CardTitle>
        <CardDescription>View and manage room bookings for the selected date.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map(room => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomSection;
