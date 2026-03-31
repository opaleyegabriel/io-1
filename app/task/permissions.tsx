import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

export async function requestPermissions() {
  const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

  if (locationStatus !== "granted" || backgroundStatus !== "granted") {
//    console.log("⚠️ Location permission not granted.");
  }

  const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
  if (notificationStatus !== "granted") {
    //console.log("⚠️ Notification permission not granted.");
  }
}
