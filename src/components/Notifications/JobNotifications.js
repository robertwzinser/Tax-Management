import { useRef, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { auth, db } from "../../firebase";
import { debug } from "util";


export default function JobNotifications({ onNotificationsUpdate }) {

  const prevNotificationsRef = useRef([]); // Store previous notifications to compare

  useEffect(() => {

    const notificationsRef = ref(db, `jobs`);

  console.log("this"+JSON.stringify(notificationsRef, null, 3))

    // Attach listener to fetch notifications
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
    

      const data = snapshot.val();
     
      const notificationsList = data
      ? Object.entries(data).map(([id, notif]) => ({
            id,
            title: notif.title,
            description: notif.description,
            pay: notif.payment,
            startDate: notif.deadline,
            type: "job"
          }))
        : [];

        console.log("job notification list: "+JSON.stringify(notificationsList, null, 3))
      // Only update notifications state if there are changes
      if (
        JSON.stringify(notificationsList) !==
        JSON.stringify(prevNotificationsRef.current)
      ) {
        // setNotifications(notificationsList);
        prevNotificationsRef.current = notificationsList;

        // Call onNotificationsUpdate only if notifications changed
        if (typeof onNotificationsUpdate === "function") {
          onNotificationsUpdate(notificationsList);
        }
      }
    });

    // Clean up listener to prevent memory leaks
    return () => unsubscribe();
  }, [onNotificationsUpdate]);

  return null;

}