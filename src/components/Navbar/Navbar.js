import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GlobalNotification from "../../components/Notifications/GlobalNotification";
import { getDatabase, ref, remove, child, get } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import "./Navbar.css";
import "../Notifications/Notifications.css";

const Navbar = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const auth = getAuth();
  const db = getDatabase();

  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);

  // Update notifications state when GlobalNotification fetches new data
  const handleNotificationsUpdate = (newNotifications) => {
    setNotifications(newNotifications);
  };

  // Dismiss a notification
  const dismissNotification = (notificationId) => {
    const notificationRef = ref(
      db,
      `notifications/${auth.currentUser?.uid}/${notificationId}`
    );
    remove(notificationRef)
      .then(() => {
        setNotifications((prev) =>
          prev.filter((notif) => notif.id !== notificationId)
        );
      })
      .catch((error) => console.error("Error deleting notification:", error));
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => new Date(timestamp).toLocaleString();

  useEffect(() => {
    const dbRef = ref(getDatabase());

    const fetchUserRole = async (userId) => {
      try {
        const snapshot = await get(child(dbRef, `users/${userId}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setUserRole(data.role);
        } else {
          console.log("No user data available");
        }
      } catch (error) {
        console.error("Error fetching user role: ", error);
      } finally {
        setLoading(false);
      }
    };

    onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserRole(user.uid);
      } else {
        setUserRole("");
        setLoading(false);
      }
    });
  }, []);

  return (
    <nav className="navbar">
      <div className="left-buttons">
        <Link to="/dashboard" className="nav-item left">
          Dashboard
        </Link>
      </div>

      <div className="right-buttons">
        <Link to="/profile" className="nav-item profile-btn">
          Profile
        </Link>

        <Link to="/user-settings" className="nav-item profile-btn">
          Settings
        </Link>

        {/* Notifications Dropdown */}
        <div className="dropdown">
          <Link
            to="#"
            className="notifications-btn"
            onClick={(e) => {
              e.preventDefault();
              setShowNotifications(!showNotifications);
            }}
          >
            <NotificationsRoundedIcon sx={{ fontSize: 24 }} />
            {notifications.length > 0 && (
              <span className="notification-count">{notifications.length}</span>
            )}
          </Link>
          <div
            className={`notifications-dropdown ${
              showNotifications ? "show" : ""
            }`}
          >
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div key={notif.id} className="notification-item">
                  <span>{notif.message}</span>
                  <span className="timestamp">
                    {formatTimestamp(notif.timestamp)}
                  </span>
                  <button
                    onClick={() => dismissNotification(notif.id)}
                    className="dismiss-btn"
                  >
                    X
                  </button>
                </div>
              ))
            ) : (
              <div className="no-notifications">No notifications</div>
            )}
          </div>
        </div>
      </div>

      {/* GlobalNotification component to manage notifications */}
      <GlobalNotification onNotificationsUpdate={handleNotificationsUpdate} />
    </nav>
  );
};

export default Navbar;
