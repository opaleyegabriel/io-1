import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { checkForPendingOrdersBackground, playRingtone, getLocationAndUpdatePosition } from "./api";
import { setupDatabase, migrateToSQLite } from "./storage";



let orderFound = false; // Global flag to stop searching once an order is found

// Define Task Name
const BACKGROUND_TASK = "background-hello-task";

// ✅ Define the Background Task
TaskManager.defineTask(BACKGROUND_TASK, async () => {  
  
  await checkForPendingOrdersBackground((order) => {
    if (order) {
      //orderFound = true;
      playRingtone(); // Play sound if an order is found
    }
  });

  //return orderFound ? BackgroundFetch.Result.NewData : BackgroundFetch.Result.NoData;
  
  
  
  //getLocationAndUpdatePosition();  
  //playRingtone();
  
});


export async function registerBackgroundFetch() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK);
    if (isRegistered) {
      setupDatabase();  // Initialize the database and table
      migrateToSQLite();  // Migrate data from AsyncStorage to SQLite
     // console.log("✅ Background fetch already registered");
      return;
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK, {
      minimumInterval: 60, // Run every 1 minute
      stopOnTerminate: false, // Keep running after app closes
      startOnBoot: true, // Restart on phone reboot
    });
    setupDatabase();  // Initialize the database and table
    migrateToSQLite();  // Migrate data from AsyncStorage to SQLite

    //console.log("🎉 Background fetch registered successfully!");
  } catch (error) {
    //console.error("❌ Error registering background fetch:", error);
  }
}


/*
// Unregister Background Task
export async function unregisterBackgroundTask() {
  await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK);
  console.log("🚫 Background fetch unregistered!");
}
  */
