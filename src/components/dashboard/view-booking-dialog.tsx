
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Booking } from '@/lib/types';
import { Calendar, User, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export function ViewBookingDialog({ booking, children }: { booking: Booking; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  const formatDate = (date: string | Timestamp | undefined) => {
    if (!date) return 'N/A';
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return format(d, 'PPP');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Booking Details for Room {booking.roomNumber}</DialogTitle>
          <DialogDescription>
            Information for the current booking.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4">
            <User className="w-5 h-5 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium">Guest Name</p>
              <p className="text-foreground">{booking.guestName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium">Check-in Date</p>
              <p className="text-foreground">{formatDate(booking.checkIn)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium">Check-out Date</p>
              <p className="text-foreground">{formatDate(booking.checkOut)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Users className="w-5 h-5 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium">Number of Persons</p>
              <p className="text-foreground">{booking.numPersons}</p>
            </div>
          </div>
        </div>
        <Button onClick={() => setOpen(false)} variant="outline" className="w-full">Close</Button>
      </DialogContent>
    </Dialog>
  );
}
