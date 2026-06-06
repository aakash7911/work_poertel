import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { CameraView, Camera } from 'expo-camera';

export default function ScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    alert(`Scanned: ${data}`);
  };

  if (hasPermission === null) {
    return <Text style={styles.centerText}>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text style={styles.centerText}>No access to camera</Text>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan</Text>
      </View>
      <View style={styles.content}>
        
        {/* Camera Box */}
        <View style={styles.scannerBox}>
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            style={StyleSheet.absoluteFillObject}
            enableTorch={flash}
          />
        </View>

        {/* Buttons Row matching sketch */}
        <View style={styles.buttonRow}>
          {/* Light Button */}
          <TouchableOpacity 
            style={styles.lightButton} 
            onPress={() => setFlash(!flash)}
          >
            <View style={styles.lightInner}>
              <Text style={styles.lightText}>{flash ? 'On' : 'Off'}</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.buttonLabel}>light{'\n'}Button</Text>

          <View style={{ width: 40 }} />

          {/* Scan Button */}
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={() => setScanned(false)}
          >
            <Text style={styles.scanButtonText}>Scan</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9f0e4' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  content: { flex: 1, alignItems: 'center', paddingTop: 20 },
  scannerBox: { 
    width: 250, 
    height: 250, 
    borderWidth: 2, 
    borderColor: '#000', 
    backgroundColor: '#000', 
    marginBottom: 40 
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightButton: {
    width: 40,
    height: 60,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightInner: {
    backgroundColor: '#EAEAEA',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  buttonLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333'
  },
  scanButton: { 
    borderWidth: 2,
    borderColor: '#000',
    paddingVertical: 12, 
    paddingHorizontal: 40, 
  },
  scanButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  centerText: { textAlign: 'center', marginTop: 50, fontSize: 16 },
});
