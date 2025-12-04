
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BedDouble, Bed, UserCheck, CalendarClock } from 'lucide-react';
import type { Room } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DialogTrigger } from '../ui/dialog';

interface SummaryCardsProps {
  rooms: Room[];
  futureBookingsCount: number;
}

const SummaryCards = ({ rooms, futureBookingsCount }: SummaryCardsProps) => {
  const stats = useMemo(() => {
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
    const availableRooms = rooms.filter(r => r.status === 'Available').length;
    return { totalRooms, availableRooms, occupiedRooms, bookedRooms: futureBookingsCount };
  }, [rooms, futureBookingsCount]);

  const cardData = [
    {
      title: 'Total Rooms',
      value: stats.totalRooms,
      icon: <BedDouble className="w-6 h-6 text-muted-foreground" />,
      colorClassName: ''
    },
    {
      title: 'Rooms Available',
      value: stats.availableRooms,
      icon: <Bed className="w-6 h-6 text-green-600" />,
      colorClassName: 'bg-green-950/50 border-green-800'
    },
    {
      title: 'Rooms Occupied',
      value: stats.occupiedRooms,
      icon: <UserCheck className="w-6 h-6 text-red-600" />,
      colorClassName: 'bg-red-950/50 border-red-800'
    },
     {
      title: 'Rooms Booked',
      value: stats.bookedRooms,
      icon: <CalendarClock className="w-6 h-6 text-orange-500" />,
      colorClassName: 'bg-orange-950/50 border-orange-800',
      isClickable: true,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cardData.map(card => {
        const CardComponent = (
            <Card key={card.title} className={cn(card.colorClassName, card.isClickable && "cursor-pointer hover:border-orange-600 transition-colors")}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    {card.icon}
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold">{card.value}</div>
                </CardContent>
            </Card>
        );

        if (card.isClickable) {
            return (
                <DialogTrigger asChild key={card.title}>
                    {CardComponent}
                </DialogTrigger>
            );
        }

        return CardComponent;
      })}
    </div>
  );
};

export default SummaryCards;
