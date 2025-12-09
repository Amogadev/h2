
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Room } from '@/lib/types';
import SummaryCards from './summary-cards';
import RoomDetailsCard from './room-details-card';

interface RoomDetailsDialogProps {
  rooms: Room[];
  futureBookingsCount: number;
  children: React.ReactNode;
}

export function RoomDetailsDialog({ rooms, futureBookingsCount, children }: RoomDetailsDialogProps) {
  return (
    <Dialog>
      <RoomDetailsCard />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Room Details Summary</DialogTitle>
          <DialogDescription>
            An overview of your hotel's room status.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <SummaryCards rooms={rooms} futureBookingsCount={futureBookingsCount} />
        </div>
        {children} 
      </DialogContent>
    </Dialog>
  );
}
