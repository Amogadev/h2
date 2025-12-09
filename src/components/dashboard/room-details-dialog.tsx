
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Booking, Room } from '@/lib/types';
import SummaryCards from './summary-cards';
import RoomDetailsCard from './room-details-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { DoorClosed, DoorOpen, User, CalendarClock } from 'lucide-react';
import { FutureBookingsDialog } from './future-bookings-dialog';

interface RoomDetailsDialogProps {
  rooms: Room[];
  futureBookings: (Booking & { payment?: any })[];
}

export function RoomDetailsDialog({ rooms, futureBookings }: RoomDetailsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("all");

  const occupiedRooms = rooms.filter(r => r.status === 'Occupied');
  const availableRooms = rooms.filter(r => r.status === 'Available');

  const formatDate = (date: string | Timestamp | undefined) => {
    if (!date) return 'No booking info';
    if (date instanceof Timestamp) return format(date.toDate(), 'MMM d, yyyy');
    return format(new Date(date as string), 'MMM d, yyyy');
  };

  const RoomList = ({ roomList, emptyMessage }: { roomList: Room[], emptyMessage: string }) => (
    <ScrollArea className="h-64">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-1">
        {roomList.length > 0 ? roomList.map(room => (
            <Card key={room.id} className="flex flex-col">
            <CardHeader className='pb-2'>
                <CardTitle className="text-base flex items-center gap-2">
                {room.status === 'Occupied' ? <DoorClosed className="w-4 h-4 text-red-500" /> : <DoorOpen className="w-4 h-4 text-green-500" />}
                Room {room.roomNumber}
                </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
                {room.status === 'Occupied' ? (
                <>
                    <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{room.guestName}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">
                    {formatDate(room.checkIn)} - {formatDate(room.checkOut)}
                    </p>
                </>
                ) : (
                <p className="text-muted-foreground italic">Ready for the next guest.</p>
                )}
            </CardContent>
            </Card>
        )) : <p className="text-muted-foreground text-center col-span-full py-10">{emptyMessage}</p>}
        </div>
    </ScrollArea>
    );


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <RoomDetailsCard onClick={() => setOpen(true)} />
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Room Details Summary</DialogTitle>
          <DialogDescription>
            An overview of your hotel's room status. Click a category to see details.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <SummaryCards 
            rooms={rooms} 
            futureBookingsCount={futureBookings.length}
            onCardClick={setActiveTab}
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-4">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Rooms</TabsTrigger>
                <TabsTrigger value="available">Available</TabsTrigger>
                <TabsTrigger value="occupied">Occupied</TabsTrigger>
                <TabsTrigger value="booked">Booked</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
                <RoomList roomList={rooms} emptyMessage="No rooms found." />
            </TabsContent>
            <TabsContent value="available" className="mt-4">
                <RoomList roomList={availableRooms} emptyMessage="No rooms are currently available." />
            </TabsContent>
            <TabsContent value="occupied" className="mt-4">
                <RoomList roomList={occupiedRooms} emptyMessage="No rooms are currently occupied." />
            </TabsContent>
            <TabsContent value="booked" className="mt-4">
                <FutureBookingsDialog bookings={futureBookings} />
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
