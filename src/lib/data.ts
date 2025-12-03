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

export async function createBooking(
  newBookingData: Omit<Booking, 'id' | 'date' | 'paymentStatus' | 'roomId' | 'checkIn' | 'checkOut'> & { checkIn: Date, checkOut: Date },
  payment: Omit<Payment, 'id' | 'bookingId' | 'date' | 'roomId'>
) {
  const roomQuery = query(roomsCollection, where("roomNumber", "==", newBookingData.roomNumber));
  const roomSnapshot = await getDocs(roomQuery);

  if (roomSnapshot.empty) {
    // If room doesn't exist, create it.
    const newRoomRef = doc(collection(db, 'rooms'));
    const newRoom = {
      id: newRoomRef.id,
      roomNumber: newBookingData.roomNumber,
      status: 'Available',
    };
    await setDoc(newRoomRef, newRoom);
    
    // Now call createBooking again with the newly created room.
    // To avoid infinite recursion in case of an issue, we can just proceed with the new reference
    const roomDoc = await getDoc(newRoomRef);
    return createBookingFromRoomDoc(roomDoc, newBookingData, payment);
  } else {
    const roomDoc = roomSnapshot.docs[0];
    return createBookingFromRoomDoc(roomDoc, newBookingData, payment);
  }
}

async function createBookingFromRoomDoc(
  roomDoc: any,
  newBookingData: Omit<Booking, 'id' | 'date' | 'paymentStatus' | 'roomId' | 'checkIn' | 'checkOut'> & { checkIn: Date, checkOut: Date },
  payment: Omit<Payment, 'id' | 'bookingId' | 'date' | 'roomId'>
) {
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
