import React, { useEffect, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { MeetupProvider } from './src/context/MeetupContext';
import { BookingProvider } from './src/store/BookingContext';
import { initAnalytics } from './src/services/analytics';

type ErrorBoundaryState = { hasError: boolean };
type ErrorBoundaryProps = { children?: ReactNode };

class FatalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    if (__DEV__) {
      console.error('[FatalErrorBoundary]', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong. Please restart the app.</Text>
        </View>
      );
    }
    return this.props.children ?? null;
  }
}

function AppContent() {
  const { authUser } = useAuth();

  useEffect(() => {
    initAnalytics();
  }, []);

  const navigationKey = authUser?.uid || 'guest';

  return (
    <BookingProvider>
      <ProfileProvider>
        <MeetupProvider>
          <RootNavigator 
            isLoggedIn={!!authUser} 
            navigationKey={navigationKey}
          />
        </MeetupProvider>
      </ProfileProvider>
    </BookingProvider>
  );
}

export default function App() {
  return (
    <FatalErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </FatalErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#FFD600',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
