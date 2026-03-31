import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Open or create the database
//const db = SQLite.openDatabaseAsync("rider.db");

// ✅ Function to initialize the database
let db;

export const setupDatabase = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync("rider.db");
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS rider_data (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

//  console.log("✅ Database setup complete");
};

// ✅ Function to store a key-value pair
export const storeDataInSQLite = async (key, value) => {
  if (!db) {
    db = await SQLite.openDatabaseAsync("rider.db");
  }

  await db.runAsync(
    `INSERT INTO rider_data (key, value) 
     VALUES (?, ?) 
     ON CONFLICT(key) 
     DO UPDATE SET value = excluded.value;`,
    [key, value]
  );

//  console.log(`✅ Stored ${key}: ${value} in SQLite`);
};

// ✅ Function to retrieve data from SQLite
export const getDataFromSQLite = async (key) => {
  if (!db) {
    db = await SQLite.openDatabaseAsync("rider.db");
  }

  const result = await db.getFirstAsync(
    "SELECT value FROM rider_data WHERE key = ?;",
    [key]
  );

  return result ? result.value : null;
};

// ✅ Function to migrate data from AsyncStorage to SQLite (without duplicates)
export const migrateToSQLite = async () => {
  try {
    const savedStatus = await AsyncStorage.getItem("riderStatus");
    const riderId = await AsyncStorage.getItem("mobile");
    const riderName = await AsyncStorage.getItem("name");
    const usertype = await AsyncStorage.getItem("user_type");

    if (savedStatus) await storeDataInSQLite("riderStatus", savedStatus);
    if (riderId) await storeDataInSQLite("mobile", riderId);
    if (riderName) await storeDataInSQLite("name", riderName);
    if (usertype) await storeDataInSQLite("user_type", usertype);

//    console.log("✅ Data migrated from AsyncStorage to SQLite");

  } catch (error) {
   // console.error("⚠️ Error migrating data to SQLite:", error);
  }
};
