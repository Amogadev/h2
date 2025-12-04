
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { Booking, Payment } from '@/lib/types';
import { Timestamp, writeBatch, doc, collection } from 'firebase/firestore';
import { differenceInCalendarDays } from 'date-fns';

const NIGHTLY_RATE = 800;

const paymentSchema = z.object({
  paymentAmount: z.coerce.number().min(0.01, { message: 'Payment amount is required' }),
  paymentMode: z.enum(['UPI', 'Cash', 'GPay', 'PhonePe', 'Net Banking', 'Card']),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface CompletePaymentDialogProps {
    booking: Booking;
    advancePayment?: Payment;
}

export function CompletePaymentDialog({ booking, advancePayment }: CompletePaymentDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const checkInDate = booking.checkIn instanceof Timestamp ? booking.checkIn.toDate() : new Date(booking.checkIn);
  const checkOutDate = booking.checkOut instanceof Timestamp ? booking.checkOut.toDate() : new Date(booking.checkOut);
  
  const numberOfNights = differenceInCalendarDays(checkOutDate, checkInDate);
  const totalCost = numberOfNights * NIGHTLY_RATE;
  const amountPaid = advancePayment?.amount || 0;
  const balanceDue = totalCost - amountPaid;

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentAmount: balanceDue > 0 ? balanceDue : 0,
      paymentMode: 'Cash'
    },
  });
  
  React.useEffect(() => {
    form.setValue('paymentAmount', balanceDue > 0 ? balanceDue : 0);
  }, [balanceDue, form]);


  const onSubmit = async (data: PaymentFormValues) => {
    if (!firestore) return;
    
    try {
        const batch = writeBatch(firestore);

        // 1. Create new payment document
        const paymentRef = doc(collection(firestore, `rooms/${booking.roomId}/payments`));
        const newPayment = {
            roomId: booking.roomId,
            bookingId: booking.id,
            amount: data.paymentAmount,
            mode: data.paymentMode,
            date: Timestamp.now(), // Payment is made now
        };
        batch.set(paymentRef, newPayment);

        // 2. Update the booking's paymentStatus
        const bookingRef = doc(firestore, `rooms/${booking.roomId}/bookings/${booking.id}`);
        batch.update(bookingRef, { paymentStatus: 'Paid' });

        await batch.commit();

        toast({
            title: 'Payment Successful!',
            description: `Remaining balance for Room ${booking.roomNumber} has been paid.`,
        });
        setOpen(false);
        form.reset();
    } catch (error) {
      console.error("Error completing payment: ", error);
      toast({
        title: 'Payment Failed',
        description: (error as Error).message || 'Could not process the payment.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Complete Payment</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment for Room {booking.roomNumber}</DialogTitle>
          <DialogDescription>
            Record the final payment for {booking.guestName}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Total Cost ({numberOfNights} nights):</span>
                <span className="font-medium">${totalCost.toLocaleString()}</span>
            </div>
             <div className="flex justify-between">
                <span className="text-muted-foreground">Advance Paid:</span>
                <span className="font-medium">${amountPaid.toLocaleString()}</span>
            </div>
             <div className="flex justify-between text-base font-semibold border-t pt-2 mt-2">
                <span>Balance Due:</span>
                <span>${balanceDue.toLocaleString()}</span>
            </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="paymentAmount">Amount</Label>
                <Input id="paymentAmount" type="number" {...form.register('paymentAmount')} placeholder="Enter amount" />
                {form.formState.errors.paymentAmount && <p className="text-sm text-destructive">{form.formState.errors.paymentAmount.message}</p>}
            </div>
            <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Controller
                    name="paymentMode"
                    control={form.control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                        <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                        {['UPI', 'Cash', 'GPay', 'PhonePe', 'Net Banking', 'Card'].map(mode => (
                            <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    )}
                />
                {form.formState.errors.paymentMode && <p className="text-sm text-destructive">{form.formState.errors.paymentMode.message}</p>}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
