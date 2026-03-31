
import { useAuth } from "@/context/auth";
import { View, Text, Button } from "react-native";

export default function LoginForm(){
    const {signIn}= useAuth();
    return(
        <View
        style={{ flex: 1, justifyContent: "center", alignItems: "center"}}
        >
            <Text> Login </Text>
            <Button title="Sign in with google" onPress={signIn} />
        </View>
    )
}