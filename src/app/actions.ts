"use server";

import { createBooking as createBookingData } from "@/lib/data";
import type { Booking, Payment } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function handleCreateBooking(
    bookingData: Omit<Booking, 'id' | 'date' | 'paymentStatus' | 'roomId'>,
    paymentData: Omit<Payment, 'id' | 'bookingId' | 'date' | 'roomId'>
) {
    try {
        await createBookingData(bookingData, paymentData);
        revalidatePath('/');
        return { success: true, message: "Booking created successfully!" };
    } catch (error) {
        console.error("Failed to create booking:", error);
        return { success: false, message: "Failed to create booking." };
    }
}
