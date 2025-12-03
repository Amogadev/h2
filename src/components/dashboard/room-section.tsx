
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DoorClosed, DoorOpen, User } from 'lucide-react';
import type { Room, Booking } from '@/lib/types';
import { BookingDialog } from './booking-dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RoomSectionProps {
  rooms: Room[];
  bookings: Booking[];
}

const RoomCard = ({ room, booking }: { room: Room; booking?: Booking }) => {
  const isAvailable = room.status === 'Available';

  return (
    <Card className={cn("flex flex-col", {
        'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800': isAvailable,
        'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800': !isAvailable,
    })}>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Room {room.roomNumber}</CardTitle>
          <Badge variant={isAvailable ? 'secondary' : 'default'} className="mt-1">
            {isAvailable ? <DoorOpen className="w-4 h-4 mr-1" /> : <DoorClosed className="w-4 h-4 mr-1" />}
            {room.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow">
        {isAvailable ? (
          <div className="flex flex-col items-center justify-center flex-grow text-center text-muted-foreground">
             <DoorOpen className="w-12 h-12 mb-2" />
            <p>Ready for booking</p>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2 text-muted-foreground" />
              <span>{room.guestName}</span>
            </div>
            <p className='text-xs text-muted-foreground'>
              {room.checkIn && room.checkOut
                ? `Check-in: ${format(new Date(room.checkIn), 'MMM d')} | Check-out: ${format(new Date(room.checkOut), 'MMM d')}`
                : 'No booking info'}
            </p>
          </div>
        )}
        <div className="mt-4">
          {isAvailable ? (
            <BookingDialog room={room}>
              <Button className="w-full">Book Now</Button>
            </BookingDialog>
          ) : (
             <Button variant="outline" className="w-full">View Booking</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};


const RoomSection = ({ rooms, bookings }: RoomSectionProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Room Status</CardTitle>
        <CardDescription>View and manage room bookings.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map(room => {
            const booking = bookings.find(b => b.roomNumber === room.roomNumber);
            return <RoomCard key={room.id} room={room} booking={booking} />;
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomSection;
