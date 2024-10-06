// src/components/Layout.js
import React from "react";
import { Outlet } from "react-router-dom"; // Import Outlet from react-router-dom
import Navbar from "./Navbar"; // Import your existing Navbar component

const Layout = () => {
  return (
    <div className="layout-container">
      <div className="navbar-container">
        <Navbar /> {/* Navbar is always displayed */}
      </div>
      <div className="">
        <Outlet /> {/* This renders the page content */}
      </div>
    </div>
  );
};

export default Layout;
