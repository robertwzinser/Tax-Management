import { useLocation, useNavigate } from "react-router-dom";
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

    // Build the credential to re-authenticate the user
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

          // Re-authenticate before deleting (FireBase requirement)
          const reauthenticated = await reauthenticate();
          if (!reauthenticated) return;

          // Delete user from Realtime Database
          await remove(ref(db, "users/" + userId));

          // Delete the user from Firebase Authentication
          await deleteUser(user);

          // Redirect to sign-in page after account is deleted
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
      navigate("/sign-in"); // Redirect to sign-in after signing out
    } catch (error) {
      console.error("There was a problem signing out:", error.message);
    }
  };

  return (
    <section className="dashboard-container">
      <h1>Welcome, {firstname}!</h1>
      <div className="links-container">
        <button onClick={handleSignOut} className="dashboard-btn">
          Sign Out
        </button>
        <button
          onClick={handleDeleteAccount}
          className="dashboard-btn delete-btn"
        >
          Delete My Account
        </button>
      </div>
    </section>
  );
};

export default Dashboard;
