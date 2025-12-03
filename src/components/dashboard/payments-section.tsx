"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Payment, Booking } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Wallet } from 'lucide-react';

interface PaymentsSectionProps {
  payments: Payment[];
  bookings: Booking[];
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
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentStats.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--accent) / 0.2)' }}
                  contentStyle={{
                    background: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentsSection;
