import React from 'react';
import { SafeAreaView } from 'react-native';
import RecordingsScreen from './componets/Recording';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <RecordingsScreen />
    </SafeAreaView>
  );
}