import React, { createContext, useContext, useState } from 'react';

export type BookedEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
};

type BookingContextType = {
  bookings: BookedEvent[];
  addBooking: (event: BookedEvent) => void;
  isEventBooked: (eventId: string) => boolean;
  clearBookings: () => void;
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: React.ReactNode }) => {
  const [bookings, setBookings] = useState<BookedEvent[]>([]);

  const addBooking = (event: BookedEvent) => {
    setBookings(prev => {
      if (prev.some(b => b.id === event.id)) {
        return prev;
      }
      return [...prev, event];
    });
  };

  const isEventBooked = (eventId: string) => {
    return bookings.some(b => b.id === eventId);
  };

  const clearBookings = () => setBookings([]);

  return (
    <BookingContext.Provider value={{ bookings, addBooking, isEventBooked, clearBookings }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBookings = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within BookingProvider');
  }
  return context;
};
