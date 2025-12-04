
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
  collectionGroup,
  writeBatch,
  Firestore,
} from 'firebase/firestore';
import type { Room, Booking, Payment } from './types';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

export async function createBooking(
  db: Firestore,
  newBookingData: Omit<Booking, 'id' | 'date' | 'roomId' | 'checkIn' | 'checkOut'> & { checkIn: Date, checkOut: Date, paymentStatus: 'Paid' | 'Advance Paid' },
  payment: Omit<Payment, 'id' | 'bookingId' | 'date' | 'roomId' | 'roomNumber'>
) {
  const roomsCollection = collection(db, 'rooms');
  const roomQuery = query(roomsCollection, where("roomNumber", "==", newBookingData.roomNumber));
  
  const roomSnapshot = await getDocs(roomQuery);

  let roomDoc;

  if (roomSnapshot.empty) {
    const newRoomRef = doc(collection(db, 'rooms'));
    const newRoom = {
      id: newRoomRef.id,
      roomNumber: newBookingData.roomNumber,
      status: 'Available',
    };
    await setDoc(newRoomRef, newRoom).catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: newRoomRef.path,
            operation: 'create',
            requestResourceData: newRoom
        }));
        throw error;
    });
    roomDoc = await getDoc(newRoomRef);
  } else {
    roomDoc = roomSnapshot.docs[0];
  }

  const batch = writeBatch(db);

  const bookingRef = doc(collection(db, `rooms/${roomDoc.id}/bookings`));
  const bookingWithRoomId: Booking = {
    ...newBookingData,
    id: bookingRef.id,
    roomId: roomDoc.id,
    date: Timestamp.fromDate(newBookingData.checkIn),
    checkIn: Timestamp.fromDate(newBookingData.checkIn),
    checkOut: Timestamp.fromDate(newBookingData.checkOut),
  };
  batch.set(bookingRef, bookingWithRoomId);

  const paymentWithIds = {
    ...payment,
    roomId: roomDoc.id,
    roomNumber: newBookingData.roomNumber,
    bookingId: bookingRef.id,
    date: Timestamp.fromDate(newBookingData.checkIn),
  };
  const paymentRef = doc(collection(db, `rooms/${roomDoc.id}/payments`));
  batch.set(paymentRef, paymentWithIds);
  
  const roomUpdateData = {
    status: 'Occupied',
    guestName: newBookingData.guestName,
    checkIn: Timestamp.fromDate(newBookingData.checkIn),
    checkOut: Timestamp.fromDate(newBookingData.checkOut),
  };
  batch.update(roomDoc.ref, roomUpdateData);

  try {
    await batch.commit();
  } catch (error) {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: roomDoc.ref.path,
        operation: 'write', // Batch can be complex, 'write' is a safe guess
        requestResourceData: { booking: bookingWithRoomId, payment: paymentWithIds, room: roomUpdateData }
    }));
    throw error;
  }

  return {
    booking: { ...bookingWithRoomId, id: bookingRef.id },
    payment: { ...paymentWithIds, id: paymentRef.id }
  };
}

