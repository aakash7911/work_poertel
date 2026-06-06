import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import { apiCall, API_GET_MY_JOBS } from '@/services/api';

export default function MyJobScreen() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      const response = await apiCall(API_GET_MY_JOBS);
      if (response.success) {
        setJobs(response.data || []);
        setCompanyName(response.companyName || null);
      }
      setLoading(false);
    };
    fetchJobs();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {companyName ? companyName : "No Company Joined"}
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No attendance records found.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.date || 'Date'}</Text>
              <View style={styles.statusCircle}>
                <Text style={styles.cardStatus}>{item.status || 'P'}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9f0e4' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  list: { paddingHorizontal: 20 },
  card: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 30, 
    borderWidth: 2,
    borderColor: '#000',
    marginBottom: 16 
  },
  cardTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  statusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStatus: { fontSize: 14, color: '#000', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#666' },
});
