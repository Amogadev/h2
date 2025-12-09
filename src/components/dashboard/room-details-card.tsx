
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogTrigger } from '@/components/ui/dialog';

const RoomDetailsCard = () => {
  return (
    <DialogTrigger asChild>
      <Card className="cursor-pointer hover:bg-muted/80 transition-colors">
        <CardHeader>
          <CardTitle>Room Details</CardTitle>
        </CardHeader>
      </Card>
    </DialogTrigger>
  );
};

export default RoomDetailsCard;
