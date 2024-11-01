import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDatabase, ref, child, get } from "firebase/database"; // Firebase imports for Realtime Database
import "./Navbar.css";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Firebase Auth import

const Navbar = () => {
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true); // To handle loading state

  useEffect(() => {
    // Initialize Firebase Auth and fetch current user
    const auth = getAuth();
    const dbRef = ref(getDatabase());

    const fetchUserRole = async (userId) => {
      try {
        const snapshot = await get(child(dbRef, `users/${userId}`)); // Fetching user role from DB
        if (snapshot.exists()) {
          const data = snapshot.val();
          setUserRole(data.role); // Assign role from DB to state
        } else {
          console.log("No user data available");
        }
      } catch (error) {
        console.error("Error fetching user role: ", error);
      } finally {
        setLoading(false); // Stop loading
      }
    };

    // Auth state listener
    onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserRole(user.uid); // Fetch role using the user's UID
      } else {
        setUserRole(""); // No user logged in
        setLoading(false); // Stop loading
      }
    });
  }, []);

  if (loading) return <div></div>; // Optionally handle loading state

  return (
    <nav className="navbar">
      {/* Left-side buttons */}
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

      {/* Right-side buttons */}
      <div className="right-buttons">

        <Link to="/profile" className="nav-item profile-btn">
          Profile
        </Link>
        <Link to="/user-settings" className="nav-item settings-btn">
          Settings
        </Link>
        <Link to="/generate-1099" className="nav-item settings-btn">
          Generate 1099
        </Link>
        {userRole === "Freelancer" && (
          <Link to="/deductions" className="nav-item deductions-btn">
              Deductions
          </Link>
        )}
        {userRole === "Freelancer" && (
          <Link to="/reimbursements" className="nav-item reimbursement-btn">
            Reimbursements
          </Link>
        )}
        {userRole === "Freelancer" && (
          <Link to="/uploader" className="nav-item uploader-btn">
            Tax Uploads
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
