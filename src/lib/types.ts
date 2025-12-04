
import type { Timestamp } from "firebase/firestore";

export interface Room {
  id: string;
  roomNumber: string;
  status: 'Available' | 'Occupied' | 'Booked' | 'Maintenance';
  guestName?: string;
  checkIn?: string | Timestamp;
  checkOut?:string | Timestamp;
}

export interface Booking {
  id: string;
  roomId: string;
  roomNumber: string;
  date: string | Timestamp;
  guestName: string;
  paymentStatus: 'Paid' | 'Pending' | 'Advance Paid';
  checkIn: string | Timestamp;
  checkOut: string | Timestamp;
  numPersons: number;
}

export interface Payment {
  id: string;
  bookingId: string;
  roomId: string;
  roomNumber: string;
  amount: number;
  mode: 'UPI' | 'Cash' | 'GPay' | 'PhonePe' | 'Net Banking' | 'Card';
  date: string | Timestamp;
}
