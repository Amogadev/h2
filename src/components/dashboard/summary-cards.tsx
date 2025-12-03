"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BedDouble, Bed, UserCheck } from 'lucide-react';
import type { Room } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  rooms: Room[];
}

const SummaryCards = ({ rooms }: SummaryCardsProps) => {
  const stats = useMemo(() => {
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
    const availableRooms = totalRooms - occupiedRooms;
    return { totalRooms, availableRooms, occupiedRooms };
  }, [rooms]);

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
      colorClassName: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
    },
    {
      title: 'Rooms Occupied',
      value: stats.occupiedRooms,
      icon: <UserCheck className="w-6 h-6 text-red-600" />,
      colorClassName: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cardData.map(card => (
        <Card key={card.title} className={cn(card.colorClassName)}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SummaryCards;
