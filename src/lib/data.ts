import type { Room, Booking, Payment } from './types';
import { subDays, addDays, formatISO } from 'date-fns';

const today = new Date();

const mockRooms: Room[] = Array.from({ length: 7 }, (_, i) => ({
  id: `room-${i + 1}`,
  roomNumber: `${101 + i}`,
  status: 'Available',
}));

const mockBookings: Booking[] = [
  { id: 'booking-1', roomNumber: '101', date: formatISO(today, { representation: 'date' }), guestName: 'John Doe', paymentStatus: 'Paid', checkIn: formatISO(today, { representation: 'date' }), checkOut: formatISO(addDays(today, 2), { representation: 'date' }), numPersons: 2 },
  { id: 'booking-2', roomNumber: '103', date: formatISO(today, { representation: 'date' }), guestName: 'Jane Smith', paymentStatus: 'Paid', checkIn: formatISO(today, { representation: 'date' }), checkOut: formatISO(addDays(today, 3), { representation: 'date' }), numPersons: 1 },
  { id: 'booking-3', roomNumber: '105', date: formatISO(subDays(today, 1), { representation: 'date' }), guestName: 'Peter Jones', paymentStatus: 'Pending', checkIn: formatISO(subDays(today, 1), { representation: 'date' }), checkOut: formatISO(today, { representation: 'date' }), numPersons: 3 },
  { id: 'booking-4', roomNumber: '102', date: formatISO(addDays(today, 2), { representation: 'date' }), guestName: 'Mary Williams', paymentStatus: 'Paid', checkIn: formatISO(addDays(today, 2), { representation: 'date' }), checkOut: formatISO(addDays(today, 5), { representation: 'date' }), numPersons: 2 },
  { id: 'booking-5', roomNumber: '101', date: formatISO(subDays(today, 5), { representation: 'date' }), guestName: 'Chris Brown', paymentStatus: 'Paid', checkIn: formatISO(subDays(today, 5), { representation: 'date' }), checkOut: formatISO(subDays(today, 3), { representation: 'date' }), numPersons: 1 },
];

const mockPayments: Payment[] = [
    { id: 'payment-1', bookingId: 'booking-1', roomNumber: '101', amount: 250, mode: 'GPay', date: formatISO(today, { representation: 'date' }) },
    { id: 'payment-2', bookingId: 'booking-2', roomNumber: '103', amount: 350, mode: 'UPI', date: formatISO(today, { representation: 'date' }) },
    { id: 'payment-3', bookingId: 'booking-4', roomNumber: '102', amount: 500, mode: 'Net Banking', date: formatISO(addDays(today, 2), { representation: 'date' }) },
    { id: 'payment-4', bookingId: 'booking-5', roomNumber: '101', amount: 150, mode: 'Cash', date: formatISO(subDays(today, 5), { representation: 'date' }) },
    { id: 'payment-5', bookingId: 'booking-3', roomNumber: '105', amount: 450, mode: 'PhonePe', date: formatISO(subDays(today, 1), { representation: 'date' }) },
];

// Update room statuses based on bookings for today
mockRooms.forEach(room => {
  const todaysBooking = mockBookings.find(b => b.roomNumber === room.roomNumber && b.date === formatISO(today, { representation: 'date' }));
  if (todaysBooking) {
    room.status = 'Occupied';
    room.guestName = todaysBooking.guestName;
    room.checkIn = todaysBooking.checkIn;
    room.checkOut = todaysBooking.checkOut;
  }
});


const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getRooms(): Promise<Room[]> {
  await simulateDelay(300);
  return JSON.parse(JSON.stringify(mockRooms));
}

export async function getBookings(): Promise<Booking[]> {
  await simulateDelay(400);
  return JSON.parse(JSON.stringify(mockBookings));
}

export async function getPayments(): Promise<Payment[]> {
  await simulateDelay(500);
  return JSON.parse(JSON.stringify(mockPayments));
}

export async function getAllBookings(): Promise<Booking[]> {
    await simulateDelay(600);
    return JSON.parse(JSON.stringify(mockBookings));
}

export async function createBooking(newBookingData: Omit<Booking, 'id' | 'date' | 'paymentStatus'>, payment: Omit<Payment, 'id' | 'bookingId' | 'date'>) {
    await simulateDelay(1000);
    const newBookingId = `booking-${mockBookings.length + 1}`;
    const newBooking: Booking = {
        ...newBookingData,
        id: newBookingId,
        date: newBookingData.checkIn,
        paymentStatus: 'Paid',
    };
    mockBookings.push(newBooking);

    const newPayment: Payment = {
        ...payment,
        id: `payment-${mockPayments.length + 1}`,
        bookingId: newBookingId,
        date: newBookingData.checkIn,
    }
    mockPayments.push(newPayment);

    const roomIndex = mockRooms.findIndex(r => r.roomNumber === newBookingData.roomNumber);
    if(roomIndex !== -1) {
        mockRooms[roomIndex].status = 'Occupied';
        mockRooms[roomIndex].guestName = newBookingData.guestName;
        mockRooms[roomIndex].checkIn = newBookingData.checkIn;
        mockRooms[roomIndex].checkOut = newBookingData.checkOut;
    }

    console.log("New booking created: ", newBooking);
    console.log("New payment created: ", newPayment);
    console.log("Updated room: ", mockRooms[roomIndex]);

    return { booking: newBooking, payment: newPayment };
}
