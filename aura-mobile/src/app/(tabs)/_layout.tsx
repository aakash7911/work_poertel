import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // hide labels (text)
        tabBarStyle: { backgroundColor: '#f9f0e4', borderTopWidth: 0, elevation: 0 },
        tabBarActiveTintColor: '#E47254', // The salmon/orange theme color
        tabBarInactiveTintColor: '#A0A0A0',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="adoc"
        options={{
          tabBarIcon: ({ color }) => <FontAwesome name="file-text" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          tabBarIcon: ({ color }) => <FontAwesome name="qrcode" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-job"
        options={{
          tabBarIcon: ({ color }) => <FontAwesome name="briefcase" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
