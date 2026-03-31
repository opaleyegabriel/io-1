import { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, Animated, Image, Platform, Linking } from 'react-native';
import WalletBalance from '@/components/BalanceViews';
import Container from '@/components/container';
import NavOptions from '@/components/NavOptions';
import ProfileHeadInfo from '@/components/ProfileHeadInfo';
import SearchBar from '@/components/SearchBar';
import ScrollingText from '@/components/TopInfo';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from 'twrnc';
import { router } from 'expo-router';

export default function HomeScreen() {
  const [rideBalance, setRideBalance] = useState(0);
  const [rideBonus, setRideBonus] = useState(0);
  const [alsBalance, setAlsBalance] = useState(0);
  const [alsBonus, setAlsBonus] = useState(0);
  const [mobile, setMobile] = useState('');
  const [appMessage, setAppMessage] = useState('');
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [verify, setVerify] = useState(false);
  const [appUpgrade, setAppUpgrade] = useState(false); // App upgrade state
  const [appUpgradeStatus, setAppUpgradeStatus] = useState('');
  const [appupgradeseen, setAppupgradeseen] = useState(false);
  const [verification, setVerification] = useState('');

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0]; // For fading
  const slideAnim = useState(new Animated.Value(-100))[0]; // For sliding from top
  const scaleAnim = useState(new Animated.Value(0.9))[0]; // For scaling the overlay

  // Animation values for app upgrade
  const fadeAnimUpgrade = useState(new Animated.Value(0))[0];
  const scaleAnimUpgrade = useState(new Animated.Value(0.9))[0];

  // Fetch balance functions
  const hideUpgradeOverlay = () => {
    setAppUpgrade(false);
    
  };

  const getBalance = (mobile) => {
    fetch(`https://hoog.ng/infiniteorder/api/Customers/sumRideBalance.php?mobile=${mobile}`)
      .then((res) => res.json())
      .then((result) => {
        setRideBonus(result[0].bonus || 0);
        setRideBalance(result[0].balance);
      })
      .catch((error) => console.log(error));
  };

  const getBalanceAls = (mobile) => {
    fetch(`https://hoog.ng/infiniteorder/api/Customers/sumAlsBalance.php?mobile=${mobile}`)
      .then((res) => res.json())
      .then((result) => {
        setAlsBonus(result[0].bonus || 0);
        setAlsBalance(result[0].balance);
      })
      .catch((error) => console.log(error));
  };

  const checkProfile = (mobile) => {
    fetch(`https://hoog.ng/infiniteorder/api/Customers/readProfile.php?mobile=${mobile}`)
      .then(res => res.json())
      .then(
        (result) => {
          setVerification(result[0].verification_status);
        },
        (error) => {
          console.log(error);
        }
      );
  };

  const getAppMessage = () => {
    fetch(`https://hoog.ng/infiniteorder/api/Settings/readAppMessage.php`)
      .then((res) => res.json())
      .then((result) => {
        setAppMessage(result[0].message);
      })
      .catch((error) => console.log(error));
  };

  const getAppUpgrade = () => {
    
    fetch(`https://hoog.ng/infiniteorder/api/Settings/readAppupgrade.php`)
      .then((res) => res.json())
      .then((result) => {
        setAppUpgradeStatus(result[0].upgrade);
      })
      .catch((error) => console.log(error));
  };

  useEffect(() => {
    const handleGotToken = async () => {
      const myMobile = await AsyncStorage.getItem('mobile');
      if (myMobile) {
        setMobile(myMobile);
      } else {
        alert('Your account name not found');
      }
      //check for upgrade
      //console.log("Im checking here");
      getAppUpgrade();
      if(appUpgradeStatus === 'Y'){
        setAppUpgrade(true);
        setIsOverlayVisible(false);
      }else{
        checkProfile(mobile);
        if(verification === 'Y'){
          setIsOverlayVisible(false);
          setAppUpgrade(false);
        }else if(verification === 'N'){
          setIsOverlayVisible(true);
          setAppUpgrade(false);
          
        }
      }




    };

    handleGotToken();
  }, []);

  useEffect(() => {
    if (mobile) {
      getBalance(mobile);
      getBalanceAls(mobile);
      getAppMessage();
    }

    const intervalId = setInterval(() => {
      if (mobile) {
        getBalance(mobile);
        getBalanceAls(mobile);
        getAppMessage();
        getAppUpgrade();

        
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [mobile]);

  // Animate the overlay fade-in and slide-in
  useEffect(() => {
    if (isOverlayVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500, // Fade-in duration
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500, // Slide-in duration
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500, // Scale-in duration
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // If overlay is hidden, animate all elements to their original states
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOverlayVisible]);

  // Animate the app upgrade overlay
  useEffect(() => {
    if (appUpgrade) {
      Animated.parallel([
        Animated.timing(fadeAnimUpgrade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimUpgrade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnimUpgrade, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimUpgrade, {
          toValue: 0.9,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [appUpgrade]);

  // Function to open the app download link based on the platform
  const openAppDownload = () => {
    const url =
      Platform.OS === 'android'
        ? 'https://infiniteorder.ng/download/app-release.apk'
        : 'https://infiniteorder.ng/download/app-release.ipa';
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  const hideOverlay = () => setIsOverlayVisible(false);

  return (
    <Container>
      {/* App message as scrolling text */}
      {appMessage && <ScrollingText text={appMessage} />}

      <ProfileHeadInfo />
      <WalletBalance rideBalance={rideBalance} alsBalance={alsBalance} />

      {/* Search Bar */}
      <SearchBar />

      {/* NavOptions */}
      <NavOptions />

      {/* Overlay for app upgrade*/}
      {appUpgrade && (
        <Animated.View
        style={[
          tw`absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-70 justify-center items-center z-50`,
          { opacity: fadeAnimUpgrade, transform: [{ scale: scaleAnimUpgrade }] },
        ]}
        pointerEvents={appUpgrade ? 'auto' : 'none'}
      >
        
          <View style={tw`bg-white rounded-lg p-6 items-center`}>
            <Image
              source={{ uri: 'https://hoog.ng/infiniteorder/public/images/appupgrade.png' }}
              style={tw`w-40 h-40 mb-4`}
              resizeMode="cover"
            />
            <Text style={tw`text-black font-bold text-center mb-4`}>
              A new version of the app is available. Please update to continue using all features!
            </Text>
            <TouchableOpacity
              style={tw`bg-yellow-600 px-6 py-3 rounded-lg mb-4`}
              onPress={openAppDownload}
            >
              <Text style={tw`text-white font-bold`}>Download Now</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={hideUpgradeOverlay}>
              <Ionicons name="close-circle" size={24} style={tw`text-black`} />
            </TouchableOpacity>
          </View>
      
      </Animated.View>
      )}

      {/* Verification Overlay */}
      {isOverlayVisible && (
        <Animated.View
          style={[
            tw`absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-70 justify-center items-center z-50`,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
          ]}
          pointerEvents={isOverlayVisible ? 'auto' : 'none'}
        >
          
            <View style={tw`relative items-center justify-center`}>
              <Image
                source={{ uri: 'https://hoog.ng/infiniteorder/public/images/appbanner.jpg' }}
                style={tw`w-80 h-70 rounded-lg`}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={tw`absolute bottom-0 left-2 bg-yellow-600 px-4 py-2 rounded-lg`}
                onPress={() => router.replace('/VerifyImages')}
              >
                <Text style={[tw`text-white font-bold text-lg`, { fontFamily: 'NunitoB', fontSize: 15 }]}>
                  Verify Now
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={tw`absolute top-0 right-2 py-2`} onPress={hideOverlay}>
                <Ionicons name="close-circle" size={24} style={tw`bg-white rounded-lg`} />
              </TouchableOpacity>
            </View>
          
        </Animated.View>
      )}
    </Container>
  );
}