import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import GlobalNotification from "../../components/Notifications/GlobalNotification";
import { getDatabase, ref, remove, child, get } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import "./Navbar.css";
import "../Notifications/Notifications.css";
import JobNotifications from "../Notifications/JobNotifications";

const Navbar = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate ()
  const auth = getAuth();
  const db = getDatabase();
  console.log(notifications)
  const [userRole, setUserRole] = useState("");
  const userRoleRef = useRef()
  const [loading, setLoading] = useState(true);

  const updateShouldJobShowNotifications = () => {
    console.log(userRoleRef.current);
    
    if (!userRoleRef.current) {
      console.log("Undefined user detected");
      setShowNotifications(false);
      return;
    }
    
    if (userRoleRef.current.toLowerCase() === "freelancer") {
      setShowNotifications(true); // Freelancers see all notifications
    } else if (userRoleRef.current.toLowerCase() === "employer") {
      setShowNotifications(true); // Employers see filtered notifications
    } else {
      setShowNotifications(false); // Hide notifications for other roles
    }
  };
  // Adjusted notification rendering function to apply filtering directly in JSX based on role
  const renderNotifications = () => {
    // Check if userRoleRef.current is defined before using toLowerCase
    const displayNotifications = userRoleRef.current && userRoleRef.current.toLowerCase() === "employer"
      ? notifications.filter((notif) => notif.type !== "job") // Exclude job notifications for employers
      : notifications; // Show all notifications for freelancers or other roles
  
    // Display a message if there are no notifications to show
    if (displayNotifications.length === 0) {
      return <div className="no-notifications">No notifications</div>;
    }
  
    // Render each notification
    return displayNotifications.map((notif) => generateNotification(notif));
  };
  // Update notifications state when GlobalNotification fetches new data
  const handleNotificationsUpdate = (newNotifications) => {
    //debugger
    setNotifications(newNotifications);
    updateShouldJobShowNotifications()
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
          userRoleRef.current = data.role
          setUserRole(data.role);
        } else {
          console.log("No user data available");
        }
        updateShouldJobShowNotifications()
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
        userRoleRef.current = ""
        setUserRole("");
        setLoading(false);
      }
    });
  }, []);

  const generateNotification = (notif) => {


    if (notif.type == "job") {
      return  <>
              <div key={notif.id} onClick= {()=>navigate("/job-board")} className="notification-job-item">
              <div><strong> New Job</strong></div>
                <div>title: {notif.title}</div>
                <div>description: {notif.description}</div>
                <div>pay: {notif.pay}</div>
                <div>start-date: {notif.startDate}</div>
                <button
                  onClick={() => dismissNotification(notif.id)}
                  className="dismiss-job-notif-btn"
                >
                  x
                </button>
              </div>
            </>
    } else {
      return <>
              <div key={notif.id}onClick={() => navigate("/inbox")} className="notification-item">
                <span>{notif.message}</span>
                <span className="timestamp">
                  {formatTimestamp(notif.timestamp)}
                </span>
                <button
                  onClick={() => dismissNotification(notif.id)}
                  className="dismiss-btn"
                >
                  x
                </button>
              </div>
            </>
    }
     
    
  }
   
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
  {userRoleRef.current &&
    notifications.filter((notif) => 
      userRoleRef.current.toLowerCase() !== "employer" || notif.type !== "job"
    ).length > 0 && (
      <span className="notification-count">
        {notifications.filter((notif) => 
          userRoleRef.current.toLowerCase() !== "employer" || notif.type !== "job"
        ).length}
      </span>
    )}
</Link>

      <div
        className={`notifications-dropdown ${showNotifications ? "show" : ""}`}
      >
        {renderNotifications()}
          </div>
        </div>
      </div>

      {/* GlobalNotification component to manage notifications */}
      <GlobalNotification onNotificationsUpdate={handleNotificationsUpdate} />
      <JobNotifications onNotificationsUpdate={handleNotificationsUpdate} />
    </nav>
  );
};

export default Navbar;