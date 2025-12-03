# **App Name**: HotelZenith

## Core Features:

- Login & Authentication: Secure user authentication using email and password via Firebase Authentication, redirecting to the dashboard upon successful login.
- Real-time Room Status: Dynamically display total rooms, available rooms, and occupied rooms based on data from Firestore.
- Calendar-Based Booking Overview: A calendar component that shows daily room status and updates when a date is selected, fetching booking data from Firestore.
- Interactive Room Cards: Display room cards (1 to 7) with status and options to 'Book Now' or 'View Booking'. Integrates a booking form with customer details and auto-updates room status in Firestore.
- Payment Analytics Dashboard: Show a daily revenue dashboard with filters, displaying total rooms booked, total income, and payment breakdowns (UPI, Cash, GPay, etc.) using data from Firestore. Provide date filter to view past collections.
- Automated Status Updates: Leverage Cloud Functions for automatic room status updates and daily income calculations, triggered by Firestore events.
- AI-Powered Revenue Projection: Utilize a generative AI model to project future revenue based on historical booking data and current trends. The AI tool uses a collection of data to make informed decisions.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to convey trust and reliability in managing hotel operations.
- Background color: Light blue (#E3F2FD), a desaturated variant of the primary, for a clean and calm backdrop.
- Accent color: Purple (#7E57C2), an analogous color to blue, adds sophistication to highlights and call-to-action elements.
- Body and headline font: 'Inter', a sans-serif typeface to ensure clarity and legibility throughout the dashboard. It presents a modern, neutral aesthetic that fits with the design's goals.
- Responsive layout adapting to various screen sizes, ensuring optimal viewing on desktops, tablets, and mobile devices.
- Consistent and modern icons for clear visual communication across the dashboard.
- Subtle animations for smooth transitions and interactive feedback on user actions, enhancing the user experience.