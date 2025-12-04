
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Booking, Payment } from '@/lib/types';
import { Calendar, User, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import { useFirestore, errorEmitter, FirestorePermissionError, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { CompletePaymentDialog } from './complete-payment-dialog';
import { collection, query, where } from 'firebase/firestore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const areDatesSame = (date1: string | Timestamp, date2: string | Timestamp) => {
    const d1 = date1 instanceof Timestamp ? date1.toDate() : new Date(date1);
    const d2 = date2 instanceof Timestamp ? date2.toDate() : new Date(date2);
    return d1.toISOString().split('T')[0] === d2.toISOString().split('T')[0];
}

export function ViewBookingDialog({ booking, children }: { booking: Booking; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const paymentsQuery = useMemoFirebase(() => 
    firestore && booking ? query(collection(firestore, `rooms/${booking.roomId}/payments`), where("bookingId", "==", booking.id)) : null
  , [firestore, booking]);
  
  const { data: payments } = useCollection<Payment>(paymentsQuery);
  
  const advancePayment = payments?.find(p => areDatesSame(p.date, booking.checkIn));

  const formatDate = (date: string | Timestamp | undefined) => {
    if (!date) return 'N/A';
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return format(d, 'PPP');
  };

  const handleCheckOut = async () => {
    if (!firestore || !booking) return;

    if (booking.paymentStatus === 'Advance Paid') {
        toast({
            title: "Payment Pending",
            description: "Please complete the payment before checking out.",
            variant: "destructive",
        });
        return;
    }
    
    const batch = writeBatch(firestore);

    // Delete the booking document
    const bookingRef = doc(firestore, 'rooms', booking.roomId, 'bookings', booking.id);
    batch.delete(bookingRef);

    // Delete all associated payments
    if (payments && payments.length > 0) {
      payments.forEach(p => {
        const paymentRef = doc(firestore, `rooms/${booking.roomId}/payments`, p.id);
        batch.delete(paymentRef);
      });
    }
    
    batch.commit()
      .then(() => {
        toast({
          title: 'Check-out Successful',
          description: `${booking.guestName} has checked out from Room ${booking.roomNumber}.`,
        });
        setOpen(false);
      })
      .catch((error) => {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: bookingRef.path,
              operation: 'write',
              requestResourceData: { status: 'Checked Out' },
            })
          );
        console.error('An error occurred during check-out:', error);
      });
  };

  const CheckOutButton = () => {
    const isPaymentPending = booking.paymentStatus === 'Advance Paid';

    if (isPaymentPending) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span tabIndex={0}>
                            <Button onClick={handleCheckOut} disabled>Check Out</Button>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Complete payment before checking out.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    return <Button onClick={handleCheckOut}>Check Out</Button>;
  }


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
        <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
            <div className='flex gap-2'>
                 {booking.paymentStatus === 'Advance Paid' && (
                    <CompletePaymentDialog booking={booking} advancePayment={advancePayment} />
                 )}
                <CheckOutButton />
            </div>
            <Button onClick={() => setOpen(false)} variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
