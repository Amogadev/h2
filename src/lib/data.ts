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
  const roomsSnapshot = await getDocs(roomsCollection);
  if (roomsSnapshot.empty) {
    console.log('No rooms found, seeding initial data...');
    const today = new Date();
    const mockRooms: Omit<Room, 'id'>[] = Array.from({ length: 7 }, (_, i) => ({
      roomNumber: `${101 + i}`,
      status: 'Available',
    }));

    for (const roomData of mockRooms) {
      // This check was missing, leading to duplicates if seeding ran multiple times.
      const roomQuery = query(roomsCollection, where("roomNumber", "==", roomData.roomNumber));
      const roomDocs = await getDocs(roomQuery);
      if (roomDocs.empty) {
        await addDoc(roomsCollection, roomData);
      }
    }


    const mockBookings: Omit<Booking, 'id' | 'roomId'>[] = [
      { roomNumber: '101', date: Timestamp.fromDate(today), guestName: 'John Doe', paymentStatus: 'Paid', checkIn: Timestamp.fromDate(today), checkOut: Timestamp.fromDate(addDays(today, 2)), numPersons: 2 },
      { roomNumber: '103', date: Timestamp.fromDate(today), guestName: 'Jane Smith', paymentStatus: 'Paid', checkIn: Timestamp.fromDate(today), checkOut: Timestamp.fromDate(addDays(today, 3)), numPersons: 1 },
      { roomNumber: '105', date: Timestamp.fromDate(subDays(today, 1)), guestName: 'Peter Jones', paymentStatus: 'Pending', checkIn: Timestamp.fromDate(subDays(today, 1)), checkOut: Timestamp.fromDate(today), numPersons: 3 },
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
    // To prevent re-seeding and creating duplicates, we just log.
    // In a real app, you might want more sophisticated data migration logic.
    console.log('Rooms collection already contains data, skipping seed.');
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
