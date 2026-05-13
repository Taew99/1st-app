import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

interface Props {
  fullScreen?: boolean;
}

export function LoadingSpinner({ fullScreen = false }: Props) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size="large" color="#111" />
      </View>
    );
  }
  return <ActivityIndicator size="small" color="#111" />;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
