// src/components/Layout.js
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import SideMenu from "../SideMenu/SideMenu";
import Box from "@mui/material/Box";
import Chatbot from "../Chatbot";


const drawerWidth = 0;

const Layout = () => {
  return (
    <Box sx={{ display: "flex" }}>
      <SideMenu />

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: `${drawerWidth}px`,
        }}
      >
        <Navbar />
        <Outlet />
        <Chatbot /> 
      </Box>
    </Box>
  );
};

export default Layout;
