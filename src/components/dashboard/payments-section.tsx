"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Payment, Booking } from '@/lib/types';
import { DollarSign, Wallet, CreditCard, Landmark } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, parseISO } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface PaymentsSectionProps {
  payments: Payment[];
  bookings: Booking[];
}

const paymentModeIcons: Record<string, React.ReactNode> = {
    'GPay': <Wallet className="w-5 h-5 text-blue-500" />,
    'UPI': <Wallet className="w-5 h-5 text-purple-500" />,
    'Cash': <DollarSign className="w-5 h-5 text-green-500" />,
    'PhonePe': <Wallet className="w-5 h-5 text-indigo-500" />,
    'Net Banking': <Landmark className="w-5 h-5 text-red-500" />,
    'Card': <CreditCard className="w-5 h-5 text-orange-500" />,
}

function areDatesSame(date1: string | Timestamp, date2: string | Timestamp) {
    const d1 = date1 instanceof Timestamp ? date1.toDate() : new Date(date1);
    const d2 = date2 instanceof Timestamp ? date2.toDate() : new Date(date2);
    return d1.toISOString().split('T')[0] === d2.toISOString().split('T')[0];
}


const PaymentsSection = ({ payments, bookings }: PaymentsSectionProps) => {
  const paymentStats = useMemo(() => {
    const totalIncome = payments.reduce((acc, p) => acc + p.amount, 0);
    
    const paymentBreakdown = payments.reduce((acc, payment) => {
      if (!acc[payment.mode]) {
        acc[payment.mode] = { total: 0, transactions: [] };
      }
      acc[payment.mode].total += payment.amount;
      const booking = bookings.find(b => b.roomNumber === payment.roomNumber && areDatesSame(b.date, payment.date));
      acc[payment.mode].transactions.push({
        ...payment,
        guestName: booking?.guestName || 'N/A',
      });
      return acc;
    }, {} as Record<string, { total: number; transactions: (Payment & { guestName: string })[] }>);

    return { totalIncome, paymentBreakdown, totalBookings: bookings.length };
  }, [payments, bookings]);

  const formatDate = (date: string | Timestamp) => {
    if (date instanceof Timestamp) {
      return format(date.toDate(), 'MMM d');
    }
    return format(parseISO(date), 'MMM d');
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Daily Revenue</CardTitle>
        <CardDescription>Revenue and payment breakdown for the selected date.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 text-center">
            <div className='p-4 rounded-lg bg-muted/50'>
                <DollarSign className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold">
                    ${paymentStats.totalIncome.toLocaleString()}
                </p>
            </div>
            <div className='p-4 rounded-lg bg-muted/50'>
                <Wallet className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Rooms Booked</p>
                <p className="text-2xl font-bold">
                    {paymentStats.totalBookings}
                </p>
            </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-medium text-center">Payment Breakdown</h4>
          {Object.keys(paymentStats.paymentBreakdown).length > 0 ? (
            <Accordion type="multiple" className="w-full">
              {Object.entries(paymentStats.paymentBreakdown).map(([mode, data]) => (
                <AccordionItem value={mode} key={mode}>
                  <AccordionTrigger>
                    <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                            {paymentModeIcons[mode] || <Wallet className="w-5 h-5 text-muted-foreground" />}
                            <span className="font-medium">{mode}</span>
                        </div>
                        <span className="font-semibold">${data.total.toLocaleString()}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="pl-6 pr-2 space-y-2 text-sm">
                      {data.transactions.map(tx => (
                        <li key={tx.id} className="flex justify-between">
                          <span>{tx.guestName}</span>
                          <span className='text-muted-foreground'>
                            ${tx.amount.toLocaleString()} on {formatDate(tx.date)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="flex items-center justify-center h-24 text-sm text-center text-muted-foreground">
                <p>No payment data for this date.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentsSection;
