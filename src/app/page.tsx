import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { getRooms, getBookings, getPayments, getAllBookings } from '@/lib/data';
import { redirect } from 'next/navigation';

// This is a placeholder for a real auth check.
// In a real app, this would be handled by middleware or a session check.
const isAuthenticated = true; 

export default async function Home() {
  if (!isAuthenticated) {
    redirect('/login');
  }

  const today = new Date();
  const roomsData = await getRooms();
  const bookingsData = await getBookings();
  const paymentsData = await getPayments();
  const allBookingsForAI = await getAllBookings();

  return (
    <DashboardPage
      initialRooms={roomsData}
      initialBookings={bookingsData}
      initialPayments={paymentsData}
      allBookingsForAI={allBookingsForAI}
    />
  );
}
