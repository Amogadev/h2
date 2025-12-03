import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  query,
  where,
  Timestamp,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Room, Booking, Payment } from './types';
import { subDays, addDays, formatISO, startOfDay } from 'date-fns';
import { addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';


const roomsCollection = collection(db, 'rooms');

// Function to add initial mock data to Firestore
export async function seedInitialData() {
  const roomsSnapshot = await getDocs(roomsCollection);
  if (roomsSnapshot.empty) {
    console.log('No rooms found, seeding initial data...');
    const today = new Date();
    const mockRooms: Omit<Room, 'id'>[] = Array.from({ length: 7 }, (_, i) => ({
      roomNumber: `${101 + i}`,
      status: 'Available',
    }));

    const roomRefs = await Promise.all(
      mockRooms.map(roomData => addDoc(roomsCollection, roomData))
    );

    const mockBookings: Omit<Booking, 'id'>[] = [
      { roomNumber: '101', date: formatISO(today, { representation: 'date' }), guestName: 'John Doe', paymentStatus: 'Paid', checkIn: formatISO(today, { representation_date: 'date' }), checkOut: formatISO(addDays(today, 2), { representation: 'date' }), numPersons: 2 },
      { roomNumber: '103', date: formatISO(today, { representation: 'date' }), guestName: 'Jane Smith', paymentStatus: 'Paid', checkIn: formatISO(today, { representation: 'date' }), checkOut: formatISO(addDays(today, 3), { representation: 'date' }), numPersons: 1 },
      { roomNumber: '105', date: formatISO(subDays(today, 1), { representation: 'date' }), guestName: 'Peter Jones', paymentStatus: 'Pending', checkIn: formatISO(subDays(today, 1), { representation: 'date' }), checkOut: formatISO(today, { representation: 'date' }), numPersons: 3 },
    ];
    
    for (const bookingData of mockBookings) {
        const roomQuery = query(roomsCollection, where("roomNumber", "==", bookingData.roomNumber));
        const roomSnapshot = await getDocs(roomQuery);
        if (!roomSnapshot.empty) {
            const roomDoc = roomSnapshot.docs[0];
            const bookingsCollection = collection(db, `rooms/${roomDoc.id}/bookings`);
            const bookingRef = await addDoc(bookingsCollection, { ...bookingData, roomId: roomDoc.id });

            if(bookingData.paymentStatus === 'Paid') {
                const paymentsCollection = collection(db, `rooms/${roomDoc.id}/payments`);
                await addDoc(paymentsCollection, {
                    bookingId: bookingRef.id,
                    roomId: roomDoc.id,
                    roomNumber: bookingData.roomNumber,
                    amount: Math.floor(Math.random() * 500) + 100,
                    mode: 'GPay',
                    date: bookingData.date,
                });
            }
            
            await setDoc(roomDoc.ref, { 
                status: 'Occupied',
                guestName: bookingData.guestName,
                checkIn: bookingData.checkIn,
                checkOut: bookingData.checkOut,
            }, { merge: true });
        }
    }
     console.log('Finished seeding data.');
  } else {
    console.log('Rooms collection already exists, skipping seed.');
  }
}


export async function getRooms(): Promise<Room[]> {
  const snapshot = await getDocs(roomsCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
}

export async function getBookings(): Promise<Booking[]> {
    const bookings: Booking[] = [];
    const roomsSnapshot = await getDocs(roomsCollection);
    for (const roomDoc of roomsSnapshot.docs) {
        const bookingsCollection = collection(db, `rooms/${roomDoc.id}/bookings`);
        const bookingsSnapshot = await getDocs(bookingsCollection);
        bookingsSnapshot.forEach(doc => {
            bookings.push({ id: doc.id, ...doc.data() } as Booking);
        });
    }
    return bookings;
}

export async function getPayments(): Promise<Payment[]> {
    const payments: Payment[] = [];
    const roomsSnapshot = await getDocs(roomsCollection);
    for (const roomDoc of roomsSnapshot.docs) {
        const paymentsCollection = collection(db, `rooms/${roomDoc.id}/payments`);
        const paymentsSnapshot = await getDocs(paymentsCollection);
        paymentsSnapshot.forEach(doc => {
            payments.push({ id: doc.id, ...doc.data() } as Payment);
        });
    }
    return payments;
}


export async function createBooking(
  newBookingData: Omit<Booking, 'id' | 'date' | 'paymentStatus' | 'roomId'>,
  payment: Omit<Payment, 'id' | 'bookingId' | 'date' | 'roomId'>
) {
  const roomQuery = query(roomsCollection, where("roomNumber", "==", newBookingData.roomNumber));
  const roomSnapshot = await getDocs(roomQuery);

  if (roomSnapshot.empty) {
    throw new Error(`Room ${newBookingData.roomNumber} not found.`);
  }
  const roomDoc = roomSnapshot.docs[0];

  const bookingWithRoomId = {
    ...newBookingData,
    roomId: roomDoc.id,
    date: newBookingData.checkIn,
    paymentStatus: 'Paid' as const,
  };

  const bookingsCollection = collection(db, `rooms/${roomDoc.id}/bookings`);
  const bookingRef = await addDoc(bookingsCollection, bookingWithRoomId);

  const paymentWithIds = {
    ...payment,
    roomId: roomDoc.id,
    bookingId: bookingRef.id,
    date: newBookingData.checkIn,
  };
  const paymentsCollection = collection(db, `rooms/${roomDoc.id}/payments`);
  await addDoc(paymentsCollection, paymentWithIds);

  await setDoc(roomDoc.ref, {
    status: 'Occupied',
    guestName: newBookingData.guestName,
    checkIn: newBookingData.checkIn,
    checkOut: newBookingData.checkOut,
  }, { merge: true });

  return {
    booking: { ...bookingWithRoomId, id: bookingRef.id },
    payment: { ...paymentWithIds, id: 'temp-payment-id' } // Firestore generates ID, temp one is fine
  };
}
