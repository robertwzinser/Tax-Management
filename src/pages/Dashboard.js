import { useLocation, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { ref, remove, onValue } from "firebase/database"; 
import Chart from "chart.js/auto"; // Import Chart.js for visualizations
import "./Dashboard.css";

const Dashboard = () => {
  const location = useLocation();
  const { firstname } = location.state || { firstname: "User" }; // Default if no name passed
  const navigate = useNavigate();

  const [taxData, setTaxData] = useState({});
  const [incomeData, setIncomeData] = useState([]);

  useEffect(() => {
    // Fetch income and tax data from the database (example)
    const userId = auth.currentUser?.uid;
    if (userId) {
      const taxRef = ref(db, "taxData/" + userId);
      onValue(taxRef, (snapshot) => {
        setTaxData(snapshot.val() || {});
      });

      const incomeRef = ref(db, "incomeEntries/" + userId);
      onValue(incomeRef, (snapshot) => {
        setIncomeData(snapshot.val() || []);
      });
    }
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

  // Render tax and income charts using Chart.js
  useEffect(() => {
    if (incomeData.length > 0) {
      const ctx = document.getElementById("incomeChart").getContext("2d");
      new Chart(ctx, {
        type: "line",
        data: {
          labels: incomeData.map((entry) => entry.date),
          datasets: [
            {
              label: "Income",
              data: incomeData.map((entry) => entry.amount),
              borderColor: "#4caf50",
              backgroundColor: "#4caf5070",
              fill: true,
            },
          ],
        },
      });
    }
  }, [incomeData]);

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
        </div>
      </nav>

      <div className="welcome-container">
        <h1>Welcome, {firstname}!</h1>
      </div>

      <div className="dashboard-widgets">
        {/* Tax Summary Widget */}
        <div className="widget">
          <h2>Tax Summary</h2>
          <p>Estimated Taxes: ${taxData.estimatedTaxes || "N/A"}</p>
          <p>Total Income: ${taxData.totalIncome || "N/A"}</p>
        </div>

        {/* Income Tracking Chart */}
        <div className="widget">
          <h2>Income Over Time</h2>
          <canvas id="incomeChart"></canvas>
        </div>

        {/* Daily Income Entry */}
        <div className="widget">
          <h2>Add Daily Income</h2>
          <Link to="/daily-income" className="dashboard-btn">
            Add Income
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
