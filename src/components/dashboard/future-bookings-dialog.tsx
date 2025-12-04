
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Booking, Payment } from '@/lib/types';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Calendar, User, DollarSign, CreditCard, Wallet, Landmark } from 'lucide-react';

interface FutureBookingsDialogProps {
  bookings: (Booking & { payment?: Payment })[];
  children: React.ReactNode;
}

const paymentModeIcons: Record<string, React.ReactNode> = {
    'GPay': <Wallet className="w-4 h-4" />,
    'UPI': <Wallet className="w-4 h-4" />,
    'Cash': <DollarSign className="w-4 h-4" />,
    'PhonePe': <Wallet className="w-4 h-4" />,
    'Net Banking': <Landmark className="w-4 h-4" />,
    'Card': <CreditCard className="w-4 h-4" />,
};

export function FutureBookingsDialog({ bookings, children }: FutureBookingsDialogProps) {
  const formatDate = (date: string | Timestamp | undefined) => {
    if (!date) return 'N/A';
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return format(d, 'MMM d, yyyy');
  };

  return (
    <Dialog>
      {children}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upcoming Bookings</DialogTitle>
          <DialogDescription>
            Here is a list of all future bookings.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 py-4">
            {bookings.length > 0 ? (
              bookings
                .sort((a, b) => {
                    const dateA = a.checkIn instanceof Timestamp ? a.checkIn.toMillis() : new Date(a.checkIn as string).getTime();
                    const dateB = b.checkIn instanceof Timestamp ? b.checkIn.toMillis() : new Date(b.checkIn as string).getTime();
                    return dateA - dateB;
                })
                .map(booking => (
                <Card key={booking.id} className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className='text-lg'>Room {booking.roomNumber}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className='font-medium'>{booking.guestName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</span>
                    </div>
                    {booking.payment && (
                      <div className="flex items-center gap-3 pt-2 border-t border-border">
                        {paymentModeIcons[booking.payment.mode] || <DollarSign className="w-4 h-4 text-muted-foreground" />}
                        <span className='text-muted-foreground'>
                            Paid ${booking.payment.amount.toLocaleString()} via {booking.payment.mode}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="flex items-center justify-center h-40 text-sm text-center text-muted-foreground">
                <p>No upcoming bookings found.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
