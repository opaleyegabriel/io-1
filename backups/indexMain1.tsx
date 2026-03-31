import { useEffect, useRef, useState } from 'react';
import { Text, View, TouchableOpacity, Animated, Image, Platform, Linking, Alert } from 'react-native';
import WalletBalance from '@/components/BalanceViews';
import Container from '@/components/container';
import NavOptions from '@/components/NavOptions';
import ProfileHeadInfo from '@/components/ProfileHeadInfo';
import SearchBar from '@/components/SearchBar';
import ScrollingText from '@/components/TopInfo';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from 'twrnc';
import { router, useRouter } from 'expo-router';

export default function HomeScreen() {
  const [rideBalance, setRideBalance] = useState(0);
  const [rideBonus, setRideBonus] = useState(0);
  const [alsBalance, setAlsBalance] = useState(0);
  const [PROW, setPROW] = useState(0);
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



  const [pendingOrder, setPendingOrder] = useState(null);
const [showPendingOrderOverlay, setShowPendingOrderOverlay] = useState(false);
const [appMode, setAppMode] = useState('');
  
const router = useRouter();
const hasRedirected = useRef(false);

  // Fetch balance functions
  const hideUpgradeOverlay = () => {
    setAppUpgrade(false);
  };



useEffect(() => {
  if (pendingOrder && !hasRedirected.current) {
    hasRedirected.current = true;
    router.push(`/map?fromRedirect=true`);
  }
}, [pendingOrder]);





  const getBalance = (mobile) => {
    fetch(`https://hoog.ng/infiniteorder/api/Customers/sumRideBalance.php?mobile=${mobile}`)
      .then((res) => res.json())
      .then((result) => {
        setRideBonus(result[0].bonus || 0);
        setRideBalance(result[0].balance);
      })
      .catch((error) => console.log(error));
  };

  const getPROW = (mobile) => {
    fetch(`https://hoog.ng/infiniteorder/api/Customers/sumProwBalance.php?mobile=${mobile}`)
      .then((res) => res.json())
      .then((result) => {
       
        setPROW(result[0].balance);
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
  const checkPendingOrder = async (mobile) => {
   
    try {
      const res = await fetch(`https://hoog.ng/infiniteorder/api/Customers/getOrderStatus.php?mobile=${mobile}`);
      const data = await res.json();
      if (data[0]?.orderStatus !== 'Completed') {
        setPendingOrder(data[0]);
        setShowPendingOrderOverlay(true);
      } else {
        setShowPendingOrderOverlay(false);
      }
    } catch (error) {
      console.error('Error fetching order status:', error);
    }
  };
  
  const deleteUnacceptedOrder = async () => {

    Alert.alert(
      "InfiniteOrder",
      "Do you want to Delete Ride Order?",
      [
        {
          text: "No",
          onPress: () => console.log("Function execution cancelled"),
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: () => deleteRideOrdering()
        }
      ]
    );
}

const deleteRideOrdering = async () => {
  //const url = `https://hoog.ng/infiniteorder/api/TransportOrders/deleteCustomerUnpickedOrder.php?mobile=${mobile}`;

  const userData = {
    mobile:mobile
  };

  try {
    const response = await fetch('https://hoog.ng/infiniteorder/api/TransportOrders/deleteCustomerUnpickedOrder.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    let data = null;
    
    if (response.status === 500) {
      
    } else if (response.status === 204) {
          
      
      Alert.alert('Success', 'Your ride order has been successfully cancelled.');
      return; 
    } else {
      //Alert.alert("unforeseen problem occur");
      
    }
  } catch (error) {
    Alert.alert("An error occurred. Please check your network and try again.");
    
  } finally {
    
  }
};
  useEffect(() => {
    const handleGotToken = async () => {
      const myMobile = await AsyncStorage.getItem('mobile');
       const appmode = await AsyncStorage.getItem('AppMode');
      



      if (myMobile) {
        setMobile(myMobile);
        setAppMode(appmode);
        checkPendingOrder(myMobile); // <-- Add this here
      } else {
        alert('Your account name not found');
      }
      // Check for app upgrade
      getAppUpgrade();
      if (appUpgradeStatus === 'Y') {
        setAppUpgrade(true);
        setIsOverlayVisible(false);
      } else {
        // Check profile only if no app upgrade is required
        checkProfile(mobile);
        if (verification === 'Y') {
          setIsOverlayVisible(false);
          setAppUpgrade(false);
        } else if (verification === 'N') {
          setIsOverlayVisible(true);
          setAppUpgrade(false);
        }
      }
    };

    handleGotToken();
  }, [mobile, appUpgradeStatus, verification]); // Adding dependencies to properly manage state changes

  useEffect(() => {
    if (mobile) {
      getBalance(mobile);
      getBalanceAls(mobile);
      getPROW(mobile);
      getAppMessage();
    }

    const intervalId = setInterval(() => {
      if (mobile) {
        getBalance(mobile);
        getBalanceAls(mobile);
        getAppMessage();
        getAppUpgrade();
        checkPendingOrder(mobile); // <-- Add this
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
      <WalletBalance rideBalance={rideBalance} alsBalance={alsBalance} PROW={PROW}/>

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
              style={tw`w-20 h-10 rounded-lg`}
              resizeMode="cover"
            />
            <Text style={[tw`text-black font-bold text-center mb-4`,{fontFamily:"NunitoB", fontSize:15}]}>
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
      {appUpgradeStatus !== 'Y' && isOverlayVisible && (
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
              style={tw`absolute bottom-0 left-15 bg-yellow-600 px-4 py-2 mb-2 rounded-lg`}
              onPress={() => router.replace('/VerifyImages')}
            >
              <Text style={[tw`text-white  font-bold text-lg`, { fontFamily: 'NunitoB', fontSize: 10 }]}>
                Verify Now, Earn N2,500
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={tw`absolute top-0 right-2 py-2`} onPress={hideOverlay}>
              <Ionicons name="close-circle" size={24} style={tw`bg-white rounded-lg`} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
     {showPendingOrderOverlay && pendingOrder && (
         <Animated.View
         style={tw`absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-60 justify-center items-center z-50`}
       >
         <View style={tw`bg-white p-6 rounded-xl w-11/12`}>
           <Text style={tw`text-lg font-bold text-center mb-2 text-yellow-600`}>Pending Ride Order</Text>
           <Text style={tw`text-gray-700 mb-1`}>From: {pendingOrder.origin}</Text>
        <Text style={tw`text-gray-700 mb-1`}>To: {pendingOrder.destination}</Text>
          {appMode === "Normal" ? (
              <Text style={tw`text-gray-700 mb-1`}>
                Cost: ₦{parseInt(pendingOrder.cost).toLocaleString()}
              </Text>
            ) : (
              <>
                <Text style={tw`text-gray-700 mb-1`}>
                  Original Price: ₦{parseInt(pendingOrder.cost).toLocaleString()}
                </Text>
                <Text style={tw`text-gray-700 mb-1`}>
                  Discounted Price to Pay: ₦{parseInt(pendingOrder.promoCost).toLocaleString()}
                </Text>
              </>
            )}

        <Text style={tw`text-gray-700 mb-4`}>Driver: {pendingOrder.riderName || 'Pending assignment'}</Text>
           <TouchableOpacity
             style={tw`bg-yellow-600 p-3 rounded-lg mb-2`}
             //onPress={() => router.push(`/map?orderId=${pendingOrder?.orderId}`)}
             onPress={() => router.push(`/map`)}
           >
             <Text style={tw`text-white text-center`}>Continue Ride Order</Text>
           </TouchableOpacity>
     
           <TouchableOpacity
             style={tw`border border-yellow-600 p-3 rounded-lg`}
             onPress={deleteUnacceptedOrder}
           >
             <Text style={tw`text-yellow-600 text-center`}>Cancel Ride Order</Text>
           </TouchableOpacity>
         </View>
       </Animated.View>
      )}


    </Container>
  );
}
