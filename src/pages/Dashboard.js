import { useLocation, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged
} from "firebase/auth";
import { ref, remove, onValue } from "firebase/database"; 
import Chart from "chart.js/auto";
import "./Dashboard.css";
// Import role-specific components
import { EmployerWidgets } from "../components/RoleWidgets/EmployerWidgets";
import { FreelancerWidgets } from "../components/RoleWidgets/FreelancerWidgets";


const Dashboard = () => {
  const location = useLocation();
  const { firstname } = location.state || { firstname: "User" }; // Default if no name passed
  const navigate = useNavigate();

  const [taxData, setTaxData] = useState({});
  const [incomeData, setIncomeData] = useState([]);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userId = user.uid;

        const userRef = ref(db, "users/" + userId);
        onValue(userRef, (snapshot) => {
          const userData = snapshot.val();
          if (userData) {
            setUserRole(userData.role || "No role assigned");
          }
        });

        const taxRef = ref(db, "taxData/" + userId);
        onValue(taxRef, (snapshot) => {
          setTaxData(snapshot.val() || {});
        });

        const incomeRef = ref(db, "incomeEntries/" + userId);
        onValue(incomeRef, (snapshot) => {
          setIncomeData(snapshot.val() || []);
        });
      } else {
        // User is signed out
        setUserRole(""); // Reset role or handle as needed
        setTaxData({});
        setIncomeData([]);
      }
    });

    return () => unsubscribe(); // Clean up the subscription
  }, []);

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
        console.error(
          "There was a problem deleting your account:",
          error.message
        );
        alert("There was a problem deleting your account. Please try again.");
      }
    }
  };

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
      <nav className="navbar">
        <Link to="/dashboard" className="nav-item left">
          Dashboard
        </Link>
        <div className="right-buttons">
          <Link to="/profile" className="nav-item profile-btn">
            Profile
          </Link>
          <Link to="/user-settings" className="nav-item settings-btn">
            Settings
          </Link>
          <div className="right-buttons"></div>
          <Link to="/generate-1099" className="nav-item generate-btn">
            Generate 1099
          </Link>
        </div>
      </nav>

      <div className="welcome-container">
        <h1>Welcome, {firstname}!</h1>
        <p>Your role: {userRole}</p> {/* Display the user's role here */}
      </div>

      <div className="dashboard-widgets">
        {userRole === "Freelancer" ? (
          <FreelancerWidgets taxData={taxData} incomeData={incomeData} />
        ) : (
          <EmployerWidgets />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
