import React, { useState, useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { auth, db } from "../../firebase";

const GlobalNotification = ({ onNotificationsUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const userId = auth.currentUser?.uid;
  const prevNotificationsRef = useRef([]); // Store previous notifications to compare

  useEffect(() => {
    if (!userId) return;


    console.log(`Listening to notifications for userId: ${userId}`); // Debug log for userId

    // Listen only to the logged-in user's notifications
    const notificationsRef = ref(db, `notifications/${userId}`);
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      console.log(data)
      const notificationsList = data
        ? Object.entries(data).map(([id, notification]) => ({
            id,
            message: notification.message,
            timestamp: notification.timestamp,
            fromName: notification.fromName,
            type: notification.type,
          }))
        : [];

      console.log(`Fetched notifications for userId ${userId}:`, notificationsList); // Debug log for notifications

      if (
        JSON.stringify(notificationsList) !==
        JSON.stringify(prevNotificationsRef.current)
      ) {
        setNotifications(notificationsList);
        prevNotificationsRef.current = notificationsList;

        if (typeof onNotificationsUpdate === "function") {
          onNotificationsUpdate(notificationsList);
        }
      }
    });

    return () => unsubscribe();
  }, [userId, onNotificationsUpdate]);

  return null;
};

export default GlobalNotification;

