import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { apiCall, API_GET_PROFILE } from '@/services/api';

export default function MeScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const response = await apiCall(API_GET_PROFILE);
      if (response.success) {
        setProfile(response.data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header with Verify Button */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.verifyBtn}>
            <Text style={styles.verifyText}>Verify btn</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerDivider} />

        {/* Photo Circle */}
        <View style={styles.photoContainer}>
          <View style={styles.photoCircle}>
            <Text style={styles.photoText}>Photo</Text>
          </View>
        </View>

        {/* Input Fields matching sketch */}
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} value={profile?.name} placeholder="Name" editable={false} />
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flexInput]} value={profile?.uid} placeholder="UID" editable={false} />
            <Text style={styles.sideLabel}>APP. UID.</Text>
          </View>
          <TextInput style={styles.input} value={profile?.adhar} placeholder="Adhar nub." editable={false} />
          <TextInput style={styles.input} value={profile?.dob} placeholder="D O b." editable={false} />
          <TextInput style={styles.input} value={profile?.bank} placeholder="bank nub" editable={false} />
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flexInput]} value={profile?.phone} placeholder="Nubben" editable={false} />
            <Text style={styles.sideLabel}>Phone</Text>
          </View>
          <TextInput style={styles.input} value={profile?.email} placeholder="Email" editable={false} />
          <TextInput style={styles.input} value={profile?.uai} placeholder="UAI Nub." editable={false} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9f0e4' },
  scrollContent: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#000' },
  verifyBtn: { 
    borderWidth: 1, 
    borderColor: '#000', 
    borderRadius: 20, 
    paddingHorizontal: 12, 
    paddingVertical: 6 
  },
  verifyText: { fontSize: 12, fontWeight: '600' },
  headerDivider: { height: 1, backgroundColor: '#000', marginBottom: 20 },
  photoContainer: { alignItems: 'center', marginBottom: 30 },
  photoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: { fontSize: 14, fontWeight: '600' },
  inputContainer: { alignItems: 'center' },
  input: {
    width: '80%',
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    color: '#000',
    textAlign: 'center',
    backgroundColor: '#FFF'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginBottom: 16,
  },
  flexInput: {
    flex: 1,
    width: 'auto',
    marginBottom: 0,
  },
  sideLabel: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: 'bold',
  }
});
