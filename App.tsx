import React from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import { BookingProvider } from './src/store/BookingContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ProfileProvider } from './src/context/ProfileContext';


function AppContent() {
  const { authUser } = useAuth();
  return (
    <ProfileProvider>
      <BookingProvider>
        <RootNavigator isLoggedIn={!!authUser} />
      </BookingProvider>
    </ProfileProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
