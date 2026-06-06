import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { apiCall, API_GET_USER_ADOC } from '@/services/api';

export default function AdocScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const response = await apiCall(API_GET_USER_ADOC);
      if (response.success) {
        setData(response.data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Payments [A]</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        {loading ? (
          <ActivityIndicator size="large" color="#000" style={{ marginTop: 40 }} />
        ) : (
          data.map((item, index) => (
            <View key={item.id || index} style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Company name:</Text>
                <Text style={styles.cardValue}>{item.company || 'N/A'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>timing:</Text>
                <Text style={styles.cardValue}>{item.timing || 'inter and out'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Payment:</Text>
                <Text style={styles.cardValue}>{item.payment || 'Payment hua hai'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>help:</Text>
                <Text style={styles.cardValue}>{item.help || 'help to any possible issue'}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9f0e4' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  scrollView: { paddingHorizontal: 20 },
  card: {
    borderWidth: 2,
    borderColor: '#000',
    marginBottom: 20,
    backgroundColor: '#FFF'
  },
  cardRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    padding: 12,
  },
  cardLabel: {
    fontWeight: 'bold',
    width: 120,
  },
  cardValue: {
    flex: 1,
    color: '#333'
  }
});
