import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Subscription } from 'expo-notifications';

// Configure how notifications behave when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Subscription | null>(null);
  const responseListener = useRef<Subscription | null>(null);

  // Register for push notifications
  const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#b7790f',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
      });

      // Create additional channels for different types
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Orders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#b7790f',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
      });

      await Notifications.setNotificationChannelAsync('promotions', {
        name: 'Promotions',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Push Notifications Required',
          'Please enable push notifications in settings to receive order updates.',
          [{ text: 'OK' }]
        );
        return;
      }

      try {
        // Get Expo push token
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        
        if (!projectId) {
          console.error('Project ID not found in Constants');
          return;
        }
        
        token = (await Notifications.getExpoPushTokenAsync({
          projectId,
        })).data;

        console.log('Expo Push Token:', token);
        
        // Store token in AsyncStorage
        await AsyncStorage.setItem('expoPushToken', token);
        
        // Send token to your backend
        await sendTokenToBackend(token);
        
      } catch (error) {
        console.log('Error getting push token:', error);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  };

  // Send token to your backend
  const sendTokenToBackend = async (token: string) => {
    const mobile = await AsyncStorage.getItem('mobile');
    
    if (!mobile) return;

    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Notifications/registerPushToken.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile,
          push_token: token,
          platform: Platform.OS,
        }),
      });
      
      const result = await response.json();
      console.log('Token registration response:', result);
    } catch (error) {
      console.log('Error sending token to backend:', error);
    }
  };

  // Handle navigation when notification is tapped
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const { data } = response.notification.request.content;
    
    console.log('Notification tapped with data:', data);
    
    // Navigate based on notification type
    if (data?.type === 'ride' || data?.type === 'order') {
      if (data?.reference_id) {
        router.push({
          pathname: '/OrderDetails',
          params: { id: data.reference_id, type: data.type }
        });
      }
    } else if (data?.type === 'promotion') {
      router.push('/Promotions');
    } else if (data?.screen) {
      router.push(data.screen);
    } else {
      // Default: open notifications list
      router.push('/(tabs)/Notifications');
    }
  };

  // Schedule a local notification (for testing)
  const showLocalNotification = async (title: string, body: string, data: any = {}) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // null means show immediately
    });
  };

  // Schedule a notification for later
  const scheduleFutureNotification = async (title: string, body: string, secondsFromNow: number, data: any = {}) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: {
        seconds: secondsFromNow,
        channelId: 'default',
      },
    });
  };

  // Cancel all scheduled notifications
  const cancelAllScheduledNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  // Get all scheduled notifications
  const getScheduledNotifications = async () => {
    return await Notifications.getAllScheduledNotificationsAsync();
  };

  // Get badge count
  const getBadgeCount = async () => {
    return await Notifications.getBadgeCountAsync();
  };

  // Set badge count
  const setBadgeCount = async (count: number) => {
    await Notifications.setBadgeCountAsync(count);
  };

  useEffect(() => {
    // Register for push notifications on mount
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
      setNotification(notification);
    });

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationResponse(response);
    });

    return () => {
      // Clean up listeners - use the correct method name
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
    showLocalNotification,
    scheduleFutureNotification,
    cancelAllScheduledNotifications,
    getScheduledNotifications,
    registerForPushNotificationsAsync,
    getBadgeCount,
    setBadgeCount,
  };
};