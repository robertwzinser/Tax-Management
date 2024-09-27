import { useLocation, useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth"; // For user re-authentication and deleteUser
import { ref, remove } from "firebase/database"; // For deleting from Realtime Database
import "./Dashboard.css";

const Dashboard = () => {
  const location = useLocation();
  const { firstname } = location.state || { firstname: "User" }; // Default if no name passed
  const navigate = useNavigate();

  // Re-authenticate the user before deleting account
  const reauthenticate = async () => {
    const user = auth.currentUser;
    if (!user) return false;

    const email = user.email;
    const password = prompt(
      "Please confirm your password to delete your account:"
    );

    const credential = EmailAuthProvider.credential(email, password);

    try {
      await reauthenticateWithCredential(user, credential);
      return true;
    } catch (error) {
      console.error("Re-authentication failed:", error.message);
      alert("Re-authentication failed. Please try again.");
      return false;
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      "Are you sure you want to delete your account?"
    );
    if (confirmation) {
      try {
        const user = auth.currentUser;
        if (user) {
          const userId = user.uid;

          const reauthenticated = await reauthenticate();
          if (!reauthenticated) return;

          await remove(ref(db, "users/" + userId));

          await deleteUser(user);

          alert("Account successfully deleted.");
          navigate("/sign-in");
        }
      } catch (error) {
        console.error("There was a problem deleting your account:", error.message);
        alert("There was a problem deleting your account. Please try again.");
      }
    }
  };

  // Sign-out functionality
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate("/sign-in");
    } catch (error) {
      console.error("There was a problem signing out:", error.message);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <Link to="/dashboard" className="nav-item left">Dashboard</Link>
        <Link to="/profile" className="nav-item right">Profile</Link>
      </nav>

      {/* Welcome Message */}
      <div className="welcome-container">
        <h1>Welcome, {firstname}!</h1>
      </div>

      {/* Sign Out and Delete Account Buttons */}
      <div className="actions-container">
        <button onClick={handleSignOut} className="dashboard-btn signout-btn">
          Sign Out
        </button>
        <button
          onClick={handleDeleteAccount}
          className="dashboard-btn delete-btn"
        >
          Delete My Account
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
