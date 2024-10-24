import React, { useEffect, useState } from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import UserSettings from "./pages/UserSettings";
import DailyIncome from "./components/RoleWidgets/Freelancer/DailyIncome";
import JobBoard from "./pages/JobBoard";
import Generate1099 from "./pages/1099";
import Reimbursements from "./pages/Reimbursements";
import Layout from "./components/Navbar/Layout";
import AboutPage from "./pages/About";
import Messaging from "./components/Messaging";
import Deductions from "./pages/Deductions";
import { onAuthStateChanged } from "firebase/auth"; // Import Firebase auth listener
import { auth } from "./firebase"; // Import your Firebase config

// Import missing components here
import FreelancerDetail from "./components/RoleWidgets/Employer/FreelancerDetail"; // Ensure the correct path
import AddIncomeForm from "./components/RoleWidgets/Employer/AddIncomeForm"; // Ensure the correct path

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state to wait for auth check

  useEffect(() => {
    // Listen for changes in the user's authentication state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true); // User is authenticated
      } else {
        setIsLoggedIn(false); // User is not authenticated
      }
      setLoading(false); // Set loading to false after auth check
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div></div>; // Display a loading state
  }

  return (
    <Router>
      <Routes>
        {/* Default route - redirect to sign-in if not logged in */}
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/sign-in" />
            )
          }
        />

        {/* Public routes */}
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />

        {/* Protected routes */}
        <Route path="/" element={<Layout />}>
          <Route
            path="/dashboard"
            element={isLoggedIn ? <Dashboard /> : <Navigate to="/sign-in" />}
          />
          <Route
            path="/inbox"
            element={isLoggedIn ? <Messaging /> : <Navigate to="/sign-in" />}
          />
          <Route
            path="/profile"
            element={isLoggedIn ? <Profile /> : <Navigate to="/sign-in" />}
          />
          <Route
            path="/user-settings"
            element={isLoggedIn ? <UserSettings /> : <Navigate to="/sign-in" />}
          />
          <Route
            path="/daily-income"
            element={isLoggedIn ? <DailyIncome /> : <Navigate to="/sign-in" />}
          />
          <Route
            path="/job-board"
            element={isLoggedIn ? <JobBoard /> : <Navigate to="/sign-in" />}
          />
          <Route
            path="/generate-1099"
            element={isLoggedIn ? <Generate1099 /> : <Navigate to="/sign-in" />}
          />

          <Route
            path="/deductions"
            element={isLoggedIn ? <Deductions /> : <Navigate to="/sign-in" />}
          />
          <Route
            path="/reimbursements"
            element={
              isLoggedIn ? <Reimbursements /> : <Navigate to="/sign-in" />
            }
          />
          {/* Freelancer Detail and Add Income routes */}
          <Route
            path="/freelancer/:freelancerId"
            element={
              isLoggedIn ? <FreelancerDetail /> : <Navigate to="/sign-in" />
            }
          />
          <Route
            path="/add-income/:freelancerId"
            element={
              isLoggedIn ? <AddIncomeForm /> : <Navigate to="/sign-in" />
            }
          />

          <Route path="/about" element={<AboutPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
