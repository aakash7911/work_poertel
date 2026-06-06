import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  const handleLogin = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        
        {/* Main App Container with the new background color */}
        <View style={styles.appBackground}>
          
          {/* Header Graphic Section */}
          <View style={styles.headerGraphic}>
            {/* Shapes */}
            <View style={styles.shapeYellow} />
            <View style={styles.shapeTeal} />
            
            {/* Title */}
            <Text style={styles.headerTitle}>Create an{'\n'}account</Text>
          </View>

          {/* Card Section */}
          <View style={styles.card}>
            
            {/* Google Sign In Button */}
            <TouchableOpacity style={styles.googleButton} activeOpacity={0.7} onPress={handleLogin}>
              <View style={styles.googleIconContainer}>
                {/* Simple representation of Google Logo */}
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </TouchableOpacity>

            <Text style={styles.dividerText}>or</Text>

            {/* Form Fields */}
            <View style={styles.row}>
              <TextInput 
                style={[styles.input, styles.flexInput]} 
                placeholder="First Name" 
                placeholderTextColor="#A0A0A0" 
              />
              <View style={{ width: 12 }} />
              <TextInput 
                style={[styles.input, styles.flexInput]} 
                placeholder="Last Name" 
                placeholderTextColor="#A0A0A0" 
              />
            </View>

            <TextInput 
              style={styles.input} 
              placeholder="Email" 
              placeholderTextColor="#A0A0A0" 
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.passwordRow}>
              <TextInput 
                style={styles.passwordInput} 
                placeholder="Password" 
                placeholderTextColor="#A0A0A0" 
                secureTextEntry 
              />
              <TouchableOpacity style={styles.eyeIconContainer}>
                {/* Simple Eye Icon */}
                <Text style={styles.eyeIcon}>👁</Text>
              </TouchableOpacity>
            </View>

            {/* Create Account Button */}
            <TouchableOpacity style={styles.createButton} activeOpacity={0.8} onPress={handleLogin}>
              <Text style={styles.createButtonText}>Create account</Text>
            </TouchableOpacity>

            {/* Terms and Login Links */}
            <Text style={styles.termsText}>
              Signing up for a Webflow account means you{'\n'}agree to the{' '}
              <Text style={styles.linkText}>Privacy Policy</Text> and{' '}
              <Text style={styles.linkText}>Terms of Service</Text>.
            </Text>

            <Text style={styles.loginText} onPress={handleLogin}>
              Have an account? <Text style={styles.loginLink}>Log in here</Text>
            </Text>

          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f0e4', // 100% matched theme background color
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  appBackground: {
    flex: 1,
    borderRadius: 30,
    // Add shadow for web/ios
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  headerGraphic: {
    backgroundColor: '#E47254', // Salmon/Orange color
    height: 220,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
  },
  shapeYellow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#C5B361',
    left: -40,
    top: 60,
  },
  shapeTeal: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#73C292',
    right: -60,
    bottom: -80,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 50,
    lineHeight: 34,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginTop: -40,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 100,
    paddingVertical: 14,
  },
  googleIconContainer: {
    marginRight: 10,
  },
  googleG: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  dividerText: {
    textAlign: 'center',
    color: '#A0A0A0',
    marginVertical: 20,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  flexInput: {
    flex: 1,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: '#333333',
    marginBottom: 12,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  passwordInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: '#333333',
  },
  eyeIconContainer: {
    backgroundColor: '#F5F5F5',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginLeft: 4,
  },
  eyeIcon: {
    fontSize: 16,
    color: '#666',
  },
  createButton: {
    backgroundColor: '#000000',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  linkText: {
    color: '#333333',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  loginText: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
    fontWeight: '500',
  },
  loginLink: {
    textDecorationLine: 'underline',
  },
});
