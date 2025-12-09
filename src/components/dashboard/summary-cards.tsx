
"use client";

import React, { useMemo } from 'react';
import { BedDouble, Bed, UserCheck, CalendarClock } from 'lucide-react';
import type { Room } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  rooms: Room[];
  futureBookingsCount: number;
  onCardClick?: (tab: string) => void;
}

const SummaryCards = ({ rooms, futureBookingsCount, onCardClick = () => {} }: SummaryCardsProps) => {
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
      tab: "all"
    },
    {
      title: 'Available',
      value: stats.availableRooms,
      icon: <Bed className="w-5 h-5 text-green-500" />,
      tab: "available"
    },
    {
      title: 'Occupied',
      value: stats.occupiedRooms,
      icon: <UserCheck className="w-5 h-5 text-red-500" />,
      tab: "occupied"
    },
    {
      title: 'Booked',
      value: stats.bookedRooms,
      icon: <CalendarClock className="w-5 h-5 text-orange-500" />,
      tab: "booked"
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {detailItems.map((item) => (
          <div 
            key={item.title} 
            className="flex items-center gap-4 p-4 rounded-lg bg-muted/40 cursor-pointer hover:bg-muted/80 transition-colors"
            onClick={() => onCardClick(item.tab)}
          >
              {item.icon}
              <div>
                <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                <p className="text-2xl font-bold">{item.value}</p>
              </div>
          </div>
      ))}
    </div>
  );
};

export default SummaryCards;
