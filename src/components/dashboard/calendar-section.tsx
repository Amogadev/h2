"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import type { Booking } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface CalendarSectionProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  bookings: Booking[];
  isDatePickerOnly?: boolean;
}

const CalendarSection = ({ selectedDate, setSelectedDate, bookings, isDatePickerOnly = false }: CalendarSectionProps) => {
  
  if (isDatePickerOnly) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                variant={'outline'}
                className={cn('w-full min-w-[280px] justify-start text-left font-normal', !selectedDate && 'text-muted-foreground')}
                >
                <CalendarIcon className="w-4 h-4 mr-2" />
                {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
  }
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Calendar Overview</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="p-0 border rounded-md">
            <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="p-0"
                classNames={{
                    root: "w-full",
                    months: "w-full",
                    month: "w-full",
                    table: "w-full",
                    head_row: "w-full",
                    row: "w-full",
                }}
            />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium text-foreground">
            Bookings for {selectedDate.toLocaleDateString()}
          </h3>
          <ScrollArea className="h-40">
            <div className="space-y-2">
              {bookings.length > 0 ? (
                bookings.map(booking => (
                  <div key={booking.id} className="flex items-center justify-between p-2 text-sm rounded-md bg-muted/50">
                    <div>
                      <p className="font-semibold">{booking.guestName}</p>
                      <p className="text-xs text-muted-foreground">Room {booking.roomNumber}</p>
                    </div>
                    <Badge variant={booking.paymentStatus === 'Paid' ? 'default' : 'secondary'}>
                      {booking.paymentStatus}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-24 text-sm text-center text-muted-foreground">
                  <p>No bookings for this date.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarSection;
