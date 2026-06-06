import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { apiCall, API_GET_ADMIN_JOBS } from '@/services/api';
import { router } from 'expo-router';

export default function DeskScreen() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminJobs = async () => {
      const response = await apiCall(API_GET_ADMIN_JOBS);
      if (response.success) {
        setJobs(response.data || []);
      }
      setLoading(false);
    };
    fetchAdminJobs();
  }, []);

  const handleLogout = () => {
    // Navigate back to login
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Bar matching sketch */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.headerIcon}>
          {/* Profile Only Photo */}
          <View style={styles.profileCircle}></View>
        </TouchableOpacity>
        
        {/* Notification Bell */}
        <TouchableOpacity style={styles.headerIcon}>
          <FontAwesome name="bell-o" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      {/* Log out button pointing from drawing */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>There is log out button</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {loading ? (
          <ActivityIndicator size="large" color="#000" style={{ marginTop: 40 }} />
        ) : jobs.length === 0 ? (
          <Text style={styles.emptyText}>No admin jobs available right now.</Text>
        ) : (
          jobs.map((item, index) => (
            <TouchableOpacity key={item.id || index} style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f0e4', // theme color
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#f9f0e4',
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#EAEAEA',
  },
  headerIcon: {
    padding: 8,
  },
  logoutContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoutButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 12,
    color: '#000',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#000',
    borderStyle: 'dashed',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#666' },
});
