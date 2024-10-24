import React, { useEffect, useState } from "react";
import { styled } from "@mui/material/styles";
import Avatar from "@mui/material/Avatar";
import MuiDrawer, { drawerClasses } from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import SelectContent from "./SelectContent"; // Import the component
import MenuContent from "./MenuContent";
import OptionsMenu from "./OptionsMenu";
import { onAuthStateChanged } from "firebase/auth"; // Firebase auth listener
import { auth } from "../../firebase"; // Import your Firebase config
import { getDatabase, ref, child, get } from "firebase/database"; // Firebase Realtime Database

const drawerWidth = 240;

const openedMixin = {
  width: drawerWidth,
  transition: "width 0.3s ease",
  overflowX: "hidden",
};

const closedMixin = {
  width: "70px", // Adjust width when collapsed
  transition: "width 0.3s ease",
  overflowX: "hidden",
};

const Drawer = styled(MuiDrawer)(({ open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open ? openedMixin : closedMixin),
  [`& .${drawerClasses.paper}`]: open ? openedMixin : closedMixin,
}));

export default function SideMenu() {
  const [user, setUser] = useState(null); // State to hold the logged-in user info
  const [userDetails, setUserDetails] = useState({
    firstname: "",
    lastname: "",
    email: "",
  });
  const [open, setOpen] = useState(true); // Sidebar open/close state

  // Listen for changes in authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser); // Set the Firebase auth user info
        fetchUserDetails(currentUser.uid); // Fetch first name and last name from the database
      } else {
        setUser(null); // Clear user info if logged out
        setUserDetails({ firstname: "", lastname: "", email: "" });
      }
    });

    return () => unsubscribe(); // Clean up the listener on unmount
  }, []);

  // Function to fetch user details from Firebase Realtime Database
  const fetchUserDetails = async (uid) => {
    const dbRef = ref(getDatabase()); // Reference to the Realtime Database
    try {
      const snapshot = await get(child(dbRef, `users/${uid}`)); // Access the user's node in the database
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserDetails({
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email,
        });
      } else {
        console.error("No user data found!");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const toggleDrawer = () => {
    setOpen(!open); // Toggle sidebar open/close state
  };

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          [`& .${drawerClasses.paper}`]: {
            backgroundColor: "#1e1e1e", 
            color: "#e0e0e0", 
            overflowX: "hidden", 
          },
        }}
        open={open}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: open ? "flex-end" : "center",
            alignItems: "center",
            padding: "8px",
            borderBottom: "1px solid #333",
          }}
        >
        <IconButton
          onClick={toggleDrawer}
          sx={{
            color: "#e0e0e0",
            "&:hover": {
              backgroundColor: "transparent", 
            },
          }}
          disableRipple
          disableFocusRipple
        >
          {open ? (
            <ChevronLeftIcon sx={{ marginRight: "25px" }} />
          ) : (
            <MenuIcon />
          )}
        </IconButton>

        </Box>
        <Box
          sx={{
            display: "flex",
            mt: "calc(var(--template-frame-height, 0px) + 4px)",
            p: 1.5,
          }}
        >
          {/* Pass the `open` state to `SelectContent` */}
          <SelectContent open={open} />
        </Box>
        <Divider sx={{ backgroundColor: "#333" }} /> {/* Darker divider */}
        <MenuContent />
        <Stack
          direction="row"
          sx={{
            p: 2,
            gap: 1,
            alignItems: "center",
            borderTop: "1px solid",
            borderColor: "#333", // Darker border for the divider
          }}
        >
          <Avatar
            sizes="small"
            alt={`${userDetails.firstname} ${userDetails.lastname}`}
            src={user?.photoURL || "/static/images/avatar/7.jpg"}
            sx={{ width: 36, height: 36 }}
          />
          {open && (
            <Box sx={{ m: "auto" }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, lineHeight: "16px", color: "#e0e0e0" }}
              >
                {userDetails.firstname} {userDetails.lastname}
              </Typography>
              <Typography variant="caption" sx={{ color: "#888" }}>
                {" "}
                {/* Lighter text for email */}
                {userDetails.email}
              </Typography>
            </Box>
          )}
          {/*<OptionsMenu />*/}
        </Stack>
      </Drawer>
    </>
  );
}
