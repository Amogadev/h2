"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Payment, Booking } from '@/lib/types';
import { DollarSign, Wallet } from 'lucide-react';

interface PaymentsSectionProps {
  payments: Payment[];
  bookings: Booking[];
}

const paymentModeIcons: Record<string, React.ReactNode> = {
    'GPay': <Wallet className="w-5 h-5 text-muted-foreground" />,
    'UPI': <Wallet className="w-5 h-5 text-muted-foreground" />,
    'Cash': <DollarSign className="w-5 h-5 text-muted-foreground" />,
    'PhonePe': <Wallet className="w-5 h-5 text-muted-foreground" />,
    'Net Banking': <Wallet className="w-5 h-5 text-muted-foreground" />,
    'Card': <Wallet className="w-5 h-5 text-muted-foreground" />,
}


const PaymentsSection = ({ payments, bookings }: PaymentsSectionProps) => {
  const paymentStats = useMemo(() => {
    const totalIncome = payments.reduce((acc, p) => acc + p.amount, 0);
    const paymentBreakdown = payments.reduce((acc, p) => {
      acc[p.mode] = (acc[p.mode] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(paymentBreakdown).map(([name, amount]) => ({ name, amount }));
    
    return { totalIncome, chartData, totalBookings: bookings.length };
  }, [payments, bookings]);

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
          {paymentStats.chartData.length > 0 ? (
            <div className="space-y-3">
              {paymentStats.chartData.map(({ name, amount }) => (
                <div key={name} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <div className="flex items-center gap-3">
                    {paymentModeIcons[name] || <Wallet className="w-5 h-5 text-muted-foreground" />}
                    <span className="font-medium">{name}</span>
                  </div>
                  <span className="font-semibold">${amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
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
