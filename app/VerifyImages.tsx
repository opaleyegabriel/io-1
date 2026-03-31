import { View, StyleSheet, Text, SafeAreaView, Button, FlatList, Image, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InfiniteHeader from '@/components/InfiniteHeader';
import tw from "twrnc";
import { router } from 'expo-router';

// Directory path for storing images
const imgDir = FileSystem.documentDirectory + 'images/';

// Ensure directory exists
const ensureDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(imgDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(imgDir, { intermediates: true });
  }
};

const VerifyImages = () => {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [mobile, setMobile] = useState('');
  const [numImagesSelected, setNumImagesSelected] = useState(0); // Track selected images
  const [nameFile, setNameFile] = useState('');
  const [verified, setVerified] = useState(false);
  const [firstUpload, setFirstUpload] = useState(false);
  const [secondUpload, setSecondUpload] = useState(false);
  const [ninUploaded, setNinUploaded] = useState(false);
  const [passportUploaded, setPassporUploaded] = useState(false);
  const [adminVerified, setAdminVerified] = useState(false);



  //get user mobile number

  useEffect(() => {
    handleGotToken();
    checkProfile(mobile);
   
  });
  



  
  const handleGotToken = async () => {
   
    const MyMobile = await AsyncStorage.getItem('mobile');
    //console.log("username : ", cusName);
   
    setMobile(MyMobile);
    
  }

const UpdatePasport = async (mobile,nameFile) => {

  const userData = {
    mobile:mobile,
    customer_image:nameFile,
  };

  try {
    const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/updatePassport.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    let data = null;
    console.log(response.status);
    // Attempt to parse JSON only if the response body is non-empty and is of JSON type
    const contentLength = response.headers.get("content-length");
    if (response.ok && contentLength && parseInt(contentLength) > 0 && response.headers.get("content-type")?.includes("application/json")) {
      data = await response.json();
    }
    // console.log(response.status);
    
    if (response.status === 500) {
      alert("Pick Update fail", data?.message || "Passport Update failed");
    } else if (response.status === 201) {
      
      
      alert("Passport Image Successfully Updated for Verification");

    } else {
      alert("unforeseen problem occur");
      
    }
  } catch (error) {
    alert("An error occurred. Please check your network and try again.");
    console.error(error);
  } finally {
    
  }
}
const UpdateNIN = async (mobile,nameFile) => {

  const userData = {
    mobile:mobile,
    NIN_image:nameFile,
  };

  try {
    const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/updateNIN.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    let data = null;
    console.log(response.status);
    // Attempt to parse JSON only if the response body is non-empty and is of JSON type
    const contentLength = response.headers.get("content-length");
    if (response.ok && contentLength && parseInt(contentLength) > 0 && response.headers.get("content-type")?.includes("application/json")) {
      data = await response.json();
    }
    // console.log(response.status);
    
    if (response.status === 500) {
      alert("Pick Update fail", data?.message || "NIN Image Update failed");
    } else if (response.status === 201) {
      
      
      alert("NIN Image Successfully Updated for Verification");

    } else {
      alert("unforeseen problem occur");
      
    }
  } catch (error) {
    alert("An error occurred. Please check your network and try again.");
    console.error(error);
  } finally {
    
  }
}

//check customer profile)
const checkProfile = (mobile) => {
  fetch(`https://hoog.ng/infiniteorder/api/Customers/readProfile.php?mobile=${mobile}`)
  .then(res => {
    //console.log(res.status);
    //console.log(res.header);
    return res.json();
  })
  .then(
    (result) => {
      let data= result;
      if((result[0].customer_image != null)){
        setFirstUpload(true);
      }
      console.log(result);
      if((result[0].customer_image != null) && (result[0].NIN_image != null)){
        setVerified(true);
       
      }
      
     
  },
    (error) => {
      console.log(error);
    }
  )
};

  // Load images from file system
  const loadImages = useCallback(async () => {
    await ensureDirExists();
    const files = await FileSystem.readDirectoryAsync(imgDir);
    if (files.length > 0) {
      setImages(files.map((file) => imgDir + file));
    }
  }, []);


  // Select image from library or camera
  const selectImage = async (useLibrary: boolean) => {

    //check if number of images is more than 2
    if (numImagesSelected >= 2) {
        alert('Maximum of 2 images allowed.');
        return;
    };
    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.75,
    };

    if (useLibrary) {
      result = await ImagePicker.launchImageLibraryAsync(options);
    } else {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Camera permission is required');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    }

    // Save image if not cancelled
    if (!result.canceled) {
      saveImage(result.assets[0].uri);
      
    }
  };

  // Save image to the file system
  const saveImage = async (uri: string) => {
    setNameFile('');
    await ensureDirExists();
    if(numImagesSelected === 0){
        const filename = mobile +"passport"+ '.jpeg';
        setNameFile(filename);
        const dest = imgDir + filename;
    await FileSystem.copyAsync({ from: uri, to: dest });
    setImages((prevImages) => [...prevImages, dest]);
    setNumImagesSelected(numImagesSelected + 1);
    }else{
        const filename = mobile +"nin"+ '.jpeg'; 
        setNameFile(filename);
        const dest = imgDir + filename;
    await FileSystem.copyAsync({ from: uri, to: dest });
    setImages((prevImages) => [...prevImages, dest]);
    setNumImagesSelected(numImagesSelected + 1);
    }
    
    
  };
// Use a regular expression to extract the filename


  // Upload image to the server
  const uploadImage = async (uri: string) => {
    
     const filenameRegex = /images\/(.*)/;
      const match = filenameRegex.exec(uri);
      const filename = match[1];
     // console.log(filename);
    setUploading(true);
    try {
      await FileSystem.uploadAsync('https://hoog.ng/upload.php', uri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
      });
      //Then know the type and update database
      if (filename.toLowerCase().includes('passport')) {
        UpdatePasport(mobile,filename);
        setFirstUpload(true);
        checkProfile(mobile);
      } else if (filename.toLowerCase().includes('nin')) {
        UpdateNIN(mobile,filename);
        setSecondUpload(true);
        checkProfile(mobile);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  // Delete image from file system
  const deleteImage = async (uri: string) => {
    await FileSystem.deleteAsync(uri);
    setImages((prevImages) => prevImages.filter((image) => image !== uri));
  };

  // Load images when component mounts
  useEffect(() => {
    loadImages();
    
  }, [loadImages]);

  // Render each image item
  const renderItem = ({ item }: { item: string }) => {
    const filename = item.split('/').pop();
    return (
      <View style={styles.imageContainer}>
            <Image style={styles.image} source={{ uri: item }} />
            
            {/* Check conditions for passport or NIN */}
            {item.includes("passport") && firstUpload || verified ? (
              <Text style={styles.filename}>PASSPORT UPLOADED</Text>
            ) : item.includes("nin") && secondUpload || verified ? (
              <Text style={styles.filename}>NIN UPLOADED</Text>
            ) : (
              <Text style={styles.filename}>Click Upload Icon here</Text>
            )}

            {/* Disable button if conditions are met */}
            <Ionicons.Button
              name="cloud-upload"
              style={tw`bg-yellow-600`}
              size={20}
              onPress={() => uploadImage(item)}
              disabled={
                (item.includes("passport") && firstUpload || verified) || 
                (item.includes("nin") && secondUpload || verified)
              }
            />
            
            {/* Trash button example, uncomment if needed */}
             <View style={tw`ml-5`}>
              <Ionicons.Button
                name="trash"
                style={tw`bg-yellow-600 py-2`}
                size={20}
                onPress={() => deleteImage(item)}
              />
            </View> 
          </View>

                
    );
  };

  return (
    
    <SafeAreaView style={styles.container}>
      <InfiniteHeader />
      <Text style={[styles.title,{fontFamily:"NunitoR", fontSize:12, color:"red"}]}>Please note that this camera can only be used twice, and retakes are not allowed. Kindly ensure you have your NIN slip or card readily available before proceeding.</Text>
      {!verified && !firstUpload  && !nameFile.toLowerCase().includes('passport') &&(
         <View style={styles.buttonContainer}>
         
         {/*<TouchableOpacity
             onPress={() => selectImage(true)}
         style={tw`flex-row ml-1 py-1 px-1 bg-white rounded-lg shadow-md`}
         
       >
         
         <Text style={[
           tw`ml-1 text-black  text-yellow-700 py-1 pr-1 pl-1 font-bold`, 
           { fontSize: 12, fontFamily: 'Roboto' }  // Replace 'Roboto' with your font name
         ]}> Photo Library</Text>
       </TouchableOpacity> */}
       
       <TouchableOpacity
             onPress={() => selectImage(false)}
         style={tw`flex-row ml-1 py-1 px-1 bg-white rounded-lg shadow-md`}
         
       >
         
         <Text style={[
           tw`ml-1 text-black  text-yellow-700 py-1 pr-1 pl-1 font-bold`, 
           { fontSize: 17, fontFamily: 'Roboto' }  // Replace 'Roboto' with your font name
         ]}> Click here to Take Your Photograph <MaterialCommunityIcons name="camera" size={30} color="black" /> for Verification</Text>
       </TouchableOpacity>
       
       
         </View>
      )}

{!verified && firstUpload && !secondUpload && !nameFile.toLowerCase().includes('nin') &&(
         <View style={styles.buttonContainer}>
         
         {/*<TouchableOpacity
             onPress={() => selectImage(true)}
         style={tw`flex-row ml-1 py-1 px-1 bg-white rounded-lg shadow-md`}
         
       >
         
         <Text style={[
           tw`ml-1 text-black  text-yellow-700 py-1 pr-1 pl-1 font-bold`, 
           { fontSize: 12, fontFamily: 'Roboto' }  // Replace 'Roboto' with your font name
         ]}> Photo Library</Text>
       </TouchableOpacity> */}
       
       <TouchableOpacity
             onPress={() => selectImage(false)}
         style={tw`flex-row ml-1 py-1 px-1 bg-white rounded-lg shadow-md`}
         
       >
         
         <Text style={[
           tw`ml-1 text-black  text-yellow-700 py-1 pr-1 pl-1 font-bold`, 
           { fontSize: 17, fontFamily: 'Roboto' }  // Replace 'Roboto' with your font name
         ]}> Click here <MaterialCommunityIcons name="camera" size={30} color="black" /> to Capture your NIN Slip for Verification</Text>
       </TouchableOpacity>
       
       
         </View>
      )}




      {verified &&(
        <Text style={styles.title}>IMAGE ALREADY UPLOADED, WAIT FOR VERIFICATION</Text>
      )}
     

      

      <FlatList
        data={images}
        renderItem={renderItem}
        keyExtractor={(item) => item} // Each item should have a unique key
      />

      {uploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator color="#fff" animating size="large" />
        </View>
      )}
     
      <View style={tw`flex-row items-center mb-4`}>

      
      <MaterialCommunityIcons name="camera" size={15} color="black" />
      <Text style={[tw`ml-2 mr-2 text-lg font-bold`,{fontFamily:"NunitoR", fontSize:10}]}>Please ensure you upload a passport-sized photo of yourself and a copy of your National Identification Number (NIN) slip.</Text>
      </View>
      <TouchableOpacity
      onPress={() => router.replace("/(tabs)/")}
      style={tw`flex-row items-center mb-4`}>

<MaterialCommunityIcons name="home" size={30} color="black" />
<Text style={tw`ml-2 mr-2 text-lg font-bold`}>Home</Text>
</TouchableOpacity>
      {/* Description */}
      <Text style={tw`text-sm text-gray-700 mb-4`}>
      For enhanced security and accurate user verification, we kindly request a passport-sized photo and a copy of your National Identification Number (NIN) slip. This information will help us maintain a secure platform.
      </Text>
    </SafeAreaView>
   
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    marginTop:30,
    flex: 1,
    gap: 20,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 20,
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '500',
  },
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  image: {
    width: 80,
    height: 80,
    marginRight: 10,
  },
  filename: {
    flex: 1,
    fontSize: 14,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VerifyImages;

