
"use client";

import React, { useMemo } from 'react';
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
    const availableRooms = totalRooms - occupiedRooms;
    return { totalRooms, availableRooms, occupiedRooms, bookedRooms: futureBookingsCount };
  }, [rooms, futureBookingsCount]);

  const detailItems = [
    {
      title: 'Total Rooms',
      value: stats.totalRooms,
      icon: <BedDouble className="w-5 h-5 text-muted-foreground" />,
    },
    {
      title: 'Available',
      value: stats.availableRooms,
      icon: <Bed className="w-5 h-5 text-green-500" />,
    },
    {
      title: 'Occupied',
      value: stats.occupiedRooms,
      icon: <UserCheck className="w-5 h-5 text-red-500" />,
    },
    {
      title: 'Booked',
      value: stats.bookedRooms,
      icon: <CalendarClock className="w-5 h-5 text-orange-500" />,
      isClickable: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {detailItems.map((item) => {
        const DetailComponent = (
          <div key={item.title} className={cn(
              "flex items-center gap-4 p-4 rounded-lg bg-muted/40",
              item.isClickable && "cursor-pointer hover:bg-muted/80 transition-colors"
            )}
          >
              {item.icon}
              <div>
                <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                <p className="text-2xl font-bold">{item.value}</p>
              </div>
          </div>
        );

        if (item.isClickable) {
          return (
            <DialogTrigger asChild key={item.title}>
              {DetailComponent}
            </DialogTrigger>
          );
        }

        return DetailComponent;
      })}
    </div>
  );
};

export default SummaryCards;
