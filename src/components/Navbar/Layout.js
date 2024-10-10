// src/components/Layout.js
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import SideMenu from "../SideMenu/SideMenu";
import Box from "@mui/material/Box";

const drawerWidth = 0; // Same width as the drawer in SideMenu

const Layout = () => {
  return (
    <Box sx={{ display: "flex" }}>
      {/* SideMenu will always be displayed on the left */}
      <SideMenu />

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: `${drawerWidth}px`, // Add margin-left to prevent overlap with the SideMenu
        }}
      >
        {/* Navbar is always displayed at the top */}
        <Navbar />

        {/* This renders the page content */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
