
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Room } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { createBooking } from '@/lib/data';
import { useFirestore } from '@/firebase';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

const bookingSchema = z.object({
  customerName: z.string().min(2, { message: 'Customer name is required' }),
  checkIn: z.date({ required_error: 'Check-in date is required' }),
  checkOut: z.date({ required_error: 'Check-out date is required' }),
  numPersons: z.coerce.number().min(1, { message: 'At least one person is required' }),
  paymentType: z.enum(['Full', 'Advance']),
  paymentMode: z.enum(['UPI', 'Cash', 'GPay', 'PhonePe', 'Net Banking', 'Card']),
  paymentAmount: z.coerce.number().min(1, { message: 'Payment amount is required' }),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export function BookingDialog({ room, children }: { room: Room; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      numPersons: 1,
      paymentType: 'Full'
    },
  });

  const onSubmit = async (data: BookingFormValues) => {
    if (!firestore) {
      toast({
        title: 'Booking Failed',
        description: 'Firestore not available. Please try again later.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const bookingData = {
        roomNumber: room.roomNumber,
        guestName: data.customerName,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        numPersons: data.numPersons,
        paymentStatus: data.paymentType === 'Full' ? 'Paid' : 'Advance Paid',
      };
      const paymentData = {
        roomNumber: room.roomNumber,
        amount: data.paymentAmount,
        mode: data.paymentMode,
      };
  
      await createBooking(firestore, bookingData, paymentData);
  
      toast({
        title: 'Booking Successful!',
        description: `Room ${room.roomNumber} has been booked for ${data.customerName}.`,
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      // Errors are now handled by the global error emitter in createBooking
      // No need for a toast here unless for non-permission errors.
      if (!(error instanceof Error && error.name === 'FirebaseError')) {
         toast({
          title: 'Booking Failed',
          description: (error as Error).message || 'There was an error creating the booking.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book Room {room.roomNumber}</DialogTitle>
          <DialogDescription>Fill in the details to book this room.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input id="customerName" {...form.register('customerName')} />
            {form.formState.errors.customerName && <p className="text-sm text-destructive">{form.formState.errors.customerName.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Check-in Date</Label>
              <Controller
                name="checkIn"
                control={form.control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}
                      >
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {form.formState.errors.checkIn && <p className="text-sm text-destructive">{form.formState.errors.checkIn.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Check-out Date</Label>
              <Controller
                name="checkOut"
                control={form.control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}
                      >
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {form.formState.errors.checkOut && <p className="text-sm text-destructive">{form.formState.errors.checkOut.message}</p>}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="numPersons">Number of Persons</Label>
            <Input id="numPersons" type="number" {...form.register('numPersons')} />
            {form.formState.errors.numPersons && <p className="text-sm text-destructive">{form.formState.errors.numPersons.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Payment Type</Label>
            <Controller
              name="paymentType"
              control={form.control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex items-center gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Full" id="full-payment" />
                    <Label htmlFor="full-payment">Full Amount</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Advance" id="advance-payment" />
                    <Label htmlFor="advance-payment">Advance Payment</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="paymentAmount">Amount</Label>
                <Input id="paymentAmount" type="number" {...form.register('paymentAmount')} placeholder="e.g. 250" />
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
            {form.formState.isSubmitting ? 'Booking...' : 'Confirm Booking'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
