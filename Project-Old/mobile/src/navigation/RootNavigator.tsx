import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { useAuth } from "../hooks/useAuth";

// Auth screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";

// Main screens
import FreightListScreen from "../screens/freight/FreightListScreen";
import FreightDetailScreen from "../screens/freight/FreightDetailScreen";
import PublishFreightScreen from "../screens/freight/PublishFreightScreen";
import ChatListScreen from "../screens/chat/ChatListScreen";
import ChatRoomScreen from "../screens/chat/ChatRoomScreen";
import CommunityScreen from "../screens/community/CommunityScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import TrucksScreen from "../screens/trucks/TrucksScreen";
import AnalyticsScreen from "../screens/profile/AnalyticsScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#f97316",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: { backgroundColor: "#0f172a", borderTopColor: "#1e293a" },
      }}
    >
      <Tab.Screen name="Fretes" component={FreightListScreen} options={{ tabBarIcon: "🚛" }} />
      <Tab.Screen name="Chat" component={ChatListScreen} options={{ tabBarIcon: "💬" }} />
      <Tab.Screen name="Publicar" component={PublishFreightScreen} options={{ tabBarIcon: "➕" }} />
      <Tab.Screen name="Comunidade" component={CommunityScreen} options={{ tabBarIcon: "📰" }} />
      <Tab.Screen name="Perfil" component={ProfileScreen} options={{ tabBarIcon: "👤" }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="FreightDetail" component={FreightDetailScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <Stack.Screen name="Trucks" component={TrucksScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null; // ou SplashScreen

  return user ? <MainStack /> : <AuthStack />;
}
