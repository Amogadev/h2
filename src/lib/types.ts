export interface Room {
  id: string;
  roomNumber: string;
  status: 'Available' | 'Occupied' | 'Maintenance';
  guestName?: string;
  checkIn?: string;
  checkOut?:string;
}

export interface Booking {
  id: string;
  roomId: string;
  roomNumber: string;
  date: string; // ISO string for the date
  guestName: string;
  paymentStatus: 'Paid' | 'Pending';
  checkIn: string;
  checkOut: string;
  numPersons: number;
}

export interface Payment {
  id: string;
  bookingId: string;
  roomId: string;
  roomNumber: string;
  amount: number;
  mode: 'UPI' | 'Cash' | 'GPay' | 'PhonePe' | 'Net Banking' | 'Card';
  date: string; // ISO string for the date
}
