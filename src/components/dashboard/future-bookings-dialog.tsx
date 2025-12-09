
"use client";

import React, { useMemo } from 'react';
import { Booking, Payment } from '@/lib/types';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Calendar, User, DollarSign, CreditCard, Wallet, Landmark } from 'lucide-react';

interface FutureBookingsDialogProps {
  bookings: (Booking & { payment?: Payment })[];
}

const paymentModeIcons: Record<string, React.ReactNode> = {
    'GPay': <Wallet className="w-4 h-4" />,
    'UPI': <Wallet className="w-4 h-4" />,
    'Cash': <DollarSign className="w-4 h-4" />,
    'PhonePe': <Wallet className="w-4 h-4" />,
    'Net Banking': <Landmark className="w-4 h-4" />,
    'Card': <CreditCard className="w-4 h-4" />,
};

export function FutureBookingsDialog({ bookings }: FutureBookingsDialogProps) {
  const formatDate = (date: string | Timestamp | undefined, formatString = 'MMM d, yyyy') => {
    if (!date) return 'N/A';
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return format(d, formatString);
  };

  const groupedBookings = useMemo(() => {
    if (!bookings) return {};

    // Sort bookings by check-in date first
    const sortedBookings = bookings.sort((a, b) => {
        const dateA = a.checkIn instanceof Timestamp ? a.checkIn.toMillis() : new Date(a.checkIn as string).getTime();
        const dateB = b.checkIn instanceof Timestamp ? b.checkIn.toMillis() : new Date(b.checkIn as string).getTime();
        return dateA - dateB;
    });

    // Then group them by check-in date
    return sortedBookings.reduce((acc, booking) => {
      const checkInDate = formatDate(booking.checkIn, 'PPP'); // e.g., "Dec 5, 2025"
      if (!acc[checkInDate]) {
        acc[checkInDate] = [];
      }
      acc[checkInDate].push(booking);
      return acc;
    }, {} as Record<string, (Booking & { payment?: Payment })[]>);
  }, [bookings]);

  return (
        <ScrollArea className="h-64 pr-4">
          <div className="space-y-6">
            {Object.keys(groupedBookings).length > 0 ? (
              Object.entries(groupedBookings).map(([date, bookingsOnDate]) => (
                <div key={date} className="space-y-4">
                    <div className='flex items-center gap-3'>
                         <Calendar className="w-5 h-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold text-foreground">{date}</h3>
                    </div>
                  
                  {bookingsOnDate.map(booking => (
                    <Card key={booking.id} className="ml-8 bg-muted/30">
                      <CardHeader className='pb-4'>
                        <CardTitle className='text-base'>Room {booking.roomNumber}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className='font-medium'>{booking.guestName}</span>
                        </div>
                        <p className='text-xs text-muted-foreground pl-7'>
                            Check-out: {formatDate(booking.checkOut)}
                        </p>
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
                  ))}
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-40 text-sm text-center text-muted-foreground">
                <p>No upcoming bookings found.</p>
              </div>
            )}
          </div>
        </ScrollArea>
  );
}
