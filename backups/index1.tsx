import { View, Text, ActivityIndicator } from "react-native";

import LoginForm from "@/components/LoginForm";
import { useAuth } from "@/context/auth";

export default function index(){
  const {user,isLoading} = useAuth();

if(isLoading){
  return(
    <View
    style={{ flex: 1, justifyContent: "center", alignItems: "center"}}
    >
      <ActivityIndicator />
    </View>
  )
}

if(!user){
  return (
    <View
      style={{ flex: 1, justifyContent: "center", alignItems: "center"}}
      >
        <Text>
          {JSON.stringify(user)}
        </Text>
        <LoginForm />
    </View>
    
  )
  
 
}
  return(
    <View
      style={{ flex: 1, justifyContent: "center", alignItems: "center"}}
      >
        <Text>
          {JSON.stringify(user)}
        </Text>

    </View>
  )
}