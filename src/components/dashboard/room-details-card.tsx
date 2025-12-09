
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

const RoomDetailsCard = ({ onClick }: { onClick: () => void }) => {
  return (
    <Card className="cursor-pointer hover:bg-muted/80 transition-colors" onClick={onClick}>
      <CardHeader>
        <CardTitle>Room Details</CardTitle>
      </CardHeader>
    </Card>
  );
};

export default RoomDetailsCard;
