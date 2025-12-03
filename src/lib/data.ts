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
  onSnapshot,
  collectionGroup
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Room, Booking, Payment } from './types';
import { subDays, addDays, formatISO, startOfDay } from 'date-fns';
import { addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';


const roomsCollection = collection(db, 'rooms');

// Function to add initial mock data to Firestore
export async function seedInitialData() {
  const roomsQuery = query(roomsCollection);
  const roomsSnapshot = await getDocs(roomsQuery);
  
  // Only seed if the collection is completely empty to avoid any duplicates.
  if (roomsSnapshot.empty) {
    console.log('Rooms collection is empty, seeding initial data...');
    
    const mockRooms: Omit<Room, 'id'>[] = Array.from({ length: 7 }, (_, i) => ({
      roomNumber: `${101 + i}`,
      status: 'Available',
    }));

    for (const roomData of mockRooms) {
      await addDoc(roomsCollection, roomData);
    }

    // Refresh snapshot after adding rooms
    const updatedRoomsSnapshot = await getDocs(roomsCollection);

    const mockBookings: (Omit<Booking, 'id' | 'roomId' | 'date'> & { payment: Omit<Payment, 'id'|'bookingId'|'roomId'|'date'|'roomNumber'>})[] = [
      { roomNumber: '101', guestName: 'John Doe', paymentStatus: 'Paid', checkIn: Timestamp.fromDate(addDays(new Date(), -1)), checkOut: Timestamp.fromDate(addDays(new Date(), 1)), numPersons: 2, payment: { amount: 250, mode: 'GPay' } },
      { roomNumber: '103', guestName: 'Jane Smith', paymentStatus: 'Paid', checkIn: Timestamp.fromDate(new Date()), checkOut: Timestamp.fromDate(addDays(new Date(), 2)), numPersons: 1, payment: { amount: 300, mode: 'Cash' }  },
      { roomNumber: '105', guestName: 'Peter Jones', paymentStatus: 'Paid', checkIn: Timestamp.fromDate(new Date()), checkOut: Timestamp.fromDate(addDays(new Date(), 3)), numPersons: 3, payment: { amount: 450, mode: 'PhonePe' } },
    ];
    
    for (const bookingData of mockBookings) {
        const roomDoc = updatedRoomsSnapshot.docs.find(doc => doc.data().roomNumber === bookingData.roomNumber);

        if (roomDoc) {
            const bookingsCollection = collection(db, `rooms/${roomDoc.id}/bookings`);
            const bookingRef = await addDoc(bookingsCollection, { 
                ...bookingData, 
                roomId: roomDoc.id,
                date: bookingData.checkIn,
            });

            if(bookingData.paymentStatus === 'Paid') {
                const paymentsCollection = collection(db, `rooms/${roomDoc.id}/payments`);
                await addDoc(paymentsCollection, {
                    bookingId: bookingRef.id,
                    roomId: roomDoc.id,
                    roomNumber: bookingData.roomNumber,
                    amount: bookingData.payment.amount,
                    mode: bookingData.payment.mode,
                    date: bookingData.checkIn,
                });
            }
            
            await setDoc(roomDoc.ref, { 
                status: 'Occupied',
            }, { merge: true });
        }
    }
     console.log('Finished seeding data.');
  } else {
    console.log('Rooms collection is not empty, skipping data seeding.');
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
  newBookingData: Omit<Booking, 'id' | 'date' | 'paymentStatus' | 'roomId' | 'checkIn' | 'checkOut'> & { checkIn: Date, checkOut: Date },
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
    date: Timestamp.fromDate(newBookingData.checkIn),
    checkIn: Timestamp.fromDate(newBookingData.checkIn),
    checkOut: Timestamp.fromDate(newBookingData.checkOut),
    paymentStatus: 'Paid' as const,
  };

  const bookingsCollection = collection(db, `rooms/${roomDoc.id}/bookings`);
  const bookingRef = doc(collection(bookingsCollection)); // Create a new doc ref with an auto-generated ID

  setDocumentNonBlocking(bookingRef, bookingWithRoomId, { merge: true });


  const paymentWithIds = {
    ...payment,
    roomId: roomDoc.id,
    bookingId: bookingRef.id,
    date: Timestamp.fromDate(newBookingData.checkIn),
  };
  const paymentsCollection = collection(db, `rooms/${roomDoc.id}/payments`);
  
  const paymentRef = doc(collection(paymentsCollection));
  setDocumentNonBlocking(paymentRef, paymentWithIds, {merge: true});


  updateDocumentNonBlocking(roomDoc.ref, {
    status: 'Occupied',
    guestName: newBookingData.guestName,
    checkIn: Timestamp.fromDate(newBookingData.checkIn),
    checkOut: Timestamp.fromDate(newBookingData.checkOut),
  });

  return {
    booking: { ...bookingWithRoomId, id: bookingRef.id },
    payment: { ...paymentWithIds, id: 'temp-payment-id' } // Firestore generates ID, temp one is fine
  };
}
