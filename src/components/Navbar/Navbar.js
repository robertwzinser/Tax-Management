import React, { useState } from "react";
import { Link } from "react-router-dom";
import GlobalNotification from "../../components/Notifications/GlobalNotification";
import { getDatabase, ref, remove } from "firebase/database";
import { getAuth } from "firebase/auth";
import "./Navbar.css";
import "../Notifications/Notifications.css";

const Navbar = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const auth = getAuth();
  const db = getDatabase();

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

  return (
    <nav className="navbar">
      <div className="left-buttons">
        <Link to="/dashboard" className="nav-item left">
          Dashboard
        </Link>
        <Link to="/job-board" className="nav-item left">
          Job Board
        </Link>
        <Link to="/inbox" className="nav-item left">
          Inbox
        </Link>
      </div>

      <div className="right-buttons">
        <Link to="/profile" className="nav-item profile-btn">
          Profile
        </Link>
        <Link to="/tax-summary" className="nav-item settings-btn">
          Tax Summary
        </Link>
        <Link to="/user-settings" className="nav-item settings-btn">
          Settings
        </Link>

        {/* Notifications Dropdown */}
        <div className="dropdown">
          <button
            className="notifications-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            Notifications{" "}
            {notifications.length > 0 && `(${notifications.length})`}
          </button>
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
