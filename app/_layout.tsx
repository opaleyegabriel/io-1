// app/_layout.tsx
import { Stack, router, SplashScreen } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useEffect, useState, useCallback } from 'react';
import { Provider } from 'react-redux';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

// Font Imports
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { OpenSans_400Regular, OpenSans_600SemiBold, OpenSans_700Bold } from '@expo-google-fonts/open-sans';
import { Kalam_400Regular, Kalam_700Bold } from '@expo-google-fonts/kalam';
import { Sacramento_400Regular } from '@expo-google-fonts/sacramento';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { useColorScheme } from '@/hooks/useColorScheme';
import Layout from '@/components/Layout';
import { store } from '../store/store';
import { AuthProvider } from '@/context/auth';
import { usePushNotifications } from '@/hooks/usePushNotifications';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Configure notification handler for foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  
  // Initialize push notifications
  const { expoPushToken, notification } = usePushNotifications();

  // 1. Load Fonts
  const [fontsLoaded, fontError] = useFonts({
    RobotoR: Roboto_400Regular, 
    RobotoM: Roboto_500Medium, 
    RobotoB: Roboto_700Bold,
    LatoR: Lato_400Regular, 
    LatoB: Lato_700Bold,
    OpenSansR: OpenSans_400Regular,
    OpenSansM: OpenSans_600SemiBold, 
    OpenSansB: OpenSans_700Bold,
    KalamR: Kalam_400Regular,
    KalamB: Kalam_700Bold,
    SacR: Sacramento_400Regular,
    NunitoR: Nunito_400Regular, 
    NunitoM: Nunito_600SemiBold, 
    NunitoB: Nunito_700Bold
  });

  // 2. Handle Deep Links for OAuth Callback
  useEffect(() => {
    const handleDeepLink = async (event: Linking.EventType) => {
      console.log("🔗 Deep link received:", event.url);
      const url = event.url;
      
      // Handle OAuth callback
      if (url.includes("code=")) {
        const params = new URLSearchParams(url.split("?")[1]);
        const code = params.get("code");
        const state = params.get("state");
        
        console.log("📝 OAuth callback detected:", { code: code?.substring(0, 10) + "...", state });
        
        // Store the code temporarily
        if (code) {
          await AsyncStorage.setItem("oauth_code", code);
          if (state) await AsyncStorage.setItem("oauth_state", state);
          
          // The AuthProvider will pick this up
          console.log("✅ OAuth code stored, waiting for AuthProvider to process");
        }
      }
    };

    // Add event listener for deep links
    const subscription = Linking.addEventListener("url", handleDeepLink);
    
    // Check for initial URL (app opened from cold start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("📱 Initial URL:", url);
        handleDeepLink({ url } as Linking.EventType);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // 3. Authentication Redirect Logic
  const prepareApp = useCallback(async () => {
    try {
      const dataToken = await AsyncStorage.getItem("AccessToken");
      const usertpe = await AsyncStorage.getItem("user_type");

      // Handle deep linking from notification when app is closed
      const handleInitialNotification = async () => {
        const initialNotification = await Notifications.getLastNotificationResponseAsync();
        if (initialNotification) {
          const { data } = initialNotification.notification.request.content;
          
          // Navigate based on notification data
          if (data?.type === 'ride' || data?.type === 'order') {
            if (data?.reference_id) {
              setTimeout(() => {
                router.push({
                  pathname: '/OrderDetails',
                  params: { id: data.reference_id, type: data.type }
                });
              }, 1000);
            }
          } else if (data?.type === 'promotion') {
            setTimeout(() => {
              router.push('/Promotions');
            }, 1000);
          } else if (data?.screen) {
            setTimeout(() => {
              router.push(data.screen);
            }, 1000);
          }
        }
      };

      if (dataToken) {
        if (usertpe === "customer") {
          router.replace("/(tabs)");
          await handleInitialNotification();
        } else if (usertpe === "rider" || usertpe === "driver") {
          router.replace("/RidersDashboard");
          await handleInitialNotification();
        }
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsReady(true);
    }
  }, []);

  // 4. Log push token when available
  useEffect(() => {
    if (expoPushToken) {
      console.log('📱 Push Notification Token:', expoPushToken);
    }
  }, [expoPushToken]);

  // 5. Log notifications received
  useEffect(() => {
    if (notification) {
      console.log('📨 Notification received:', notification);
    }
  }, [notification]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      prepareApp();
    }
  }, [fontsLoaded, fontError, prepareApp]);

  // 6. Hide Splash Screen only when everything is ready
  useEffect(() => {
    if (isReady && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isReady, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <Provider store={store}>
        <Layout>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="LogisticOrderList" options={{headerShown:false}} /> 
              <Stack.Screen name="AddPROWBalance" options={{headerShown:false}} /> 
              <Stack.Screen name="logistic" options={{headerShown:false}} /> 
              <Stack.Screen name="PreOrder" options={{headerShown:false}} /> 
              <Stack.Screen name="RidersDashboard" options={{headerShown:false}} />
              <Stack.Screen name="AddAlsBalance" options={{headerShown:false}} />
              <Stack.Screen name="AddRiderBalance" options={{headerShown:false}} />
              <Stack.Screen name="SignUpScreen" options={{headerShown:false}} />
              <Stack.Screen name="changepassword" options={{headerShown:false}} />
              <Stack.Screen name="forgotpassword" options={{headerShown:false}} />
              <Stack.Screen name="RiderTransactionHistory" options={{headerShown:false}} />
              <Stack.Screen name="AllTransactionHistory" options={{headerShown:false}} />
              <Stack.Screen name="RiderOrderingHistory" options={{headerShown:false}} />
              <Stack.Screen name="VerifyImages" options={{headerShown:false}} />
              <Stack.Screen name="HelpScreen" options={{headerShown: false}} />
              <Stack.Screen name="AddMoney" options={{headerShown: false}} />
              <Stack.Screen name="CustomerService" options={{headerShown: false}} />
              <Stack.Screen name="Ride" options={{headerShown: false}} />
              <Stack.Screen name="api/MessageList" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
              <Stack.Screen name="map" options={{headerShown: false}} />
              <Stack.Screen name="als" options={{headerShown: false}} /> 
              <Stack.Screen name="index" options={{headerShown:false}} />
              
              <Stack.Screen name="PreOrderDup" options={{headerShown:false}} />
              <Stack.Screen name="logisticdup" options={{headerShown:false}} />
              
             
              <Stack.Screen name="AllOrderHistory" options={{headerShown:false}} />
              <Stack.Screen name="RiderDashboard2" options={{headerShown:false}} />
              <Stack.Screen name="(screens)/OrderSummary" options={{headerShown:false}} />
              <Stack.Screen name="api/ApiManager" options={{headerShown:false}} />
              
              {/* Add these screens for notification navigation */}
              <Stack.Screen 
                name="OrderDetails" 
                options={{ 
                  title: 'Order Details',
                  headerBackTitle: 'Back',
                }} 
              />
              <Stack.Screen 
                name="Promotions" 
                options={{ 
                  title: 'Promotions',
                  headerBackTitle: 'Back',
                }} 
              />
            </Stack>
          </ThemeProvider>
        </Layout>
      </Provider>
    </AuthProvider>
  );
}