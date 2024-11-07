import React, { useState, useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { auth, db } from "../../firebase";

const GlobalNotification = ({ onNotificationsUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const userId = auth.currentUser?.uid;
  const prevNotificationsRef = useRef([]); // Store previous notifications to compare

  useEffect(() => {
    if (!userId) return;
  
    const notificationsRef = ref(db, `notifications/${userId}`);
    
    // Attach listener to fetch notifications
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      console.log(data)
      const notificationsList = data
        ? Object.entries(data).map(([id, notification]) => ({
            id,
            message: notification.message,
            timestamp: notification.timestamp,
            fromName: notification.fromName,
          }))
        : [];

      // Only update notifications state if there are changes
      if (
        JSON.stringify(notificationsList) !==
        JSON.stringify(prevNotificationsRef.current)
      ) {
        setNotifications(notificationsList);
        prevNotificationsRef.current = notificationsList;

        // Call onNotificationsUpdate only if notifications changed
        if (typeof onNotificationsUpdate === "function") {
          onNotificationsUpdate(notificationsList);
        }
      }
    });

    // Clean up listener to prevent memory leaks
    return () => unsubscribe();
  }, [userId, onNotificationsUpdate]);

  return null;
};

export default GlobalNotification;

