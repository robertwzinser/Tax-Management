import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
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
      </div>

      {/* Right-side buttons */}
      <div className="right-buttons">
        <Link to="/expenses" className="nav-item profile-btn">
          Expenses
        </Link>
        <Link to="/profile" className="nav-item profile-btn">
          Profile
        </Link>
        <Link to="/user-settings" className="nav-item settings-btn">
          Settings
        </Link>
        <Link to="/generate-1099" className="nav-item settings-btn">
          Generate 1099
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
