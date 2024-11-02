import React, { useEffect, useState } from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import MailRoundedIcon from "@mui/icons-material/MailRounded";
import SummarizeRoundedIcon from "@mui/icons-material/SummarizeRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import { Link, useLocation } from "react-router-dom";
import { getDatabase, ref, child, get } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const iconStyle = { color: "white" };

export default function MenuContent() {
  const location = useLocation();
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);

  // Firebase Auth and role fetch logic
  useEffect(() => {
    const auth = getAuth();
    const dbRef = ref(getDatabase());

    const fetchUserRole = async (userId) => {
      try {
        const snapshot = await get(child(dbRef, `users/${userId}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setUserRole(data.role);
        } else {
          console.log("No user data available");
        }
      } catch (error) {
        console.error("Error fetching user role: ", error);
      } finally {
        setLoading(false);
      }
    };

    onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserRole(user.uid);
      } else {
        setUserRole("");
        setLoading(false);
      }
    });
  }, []);

  // Base items available to all users
  const mainListItems = [
    {
      text: "Dashboard",
      icon: <HomeRoundedIcon sx={iconStyle} />,
      link: "/dashboard",
    },
    {
      text: "Job Board",
      icon: <WorkRoundedIcon sx={iconStyle} />,
      link: "/job-board",
    },
    { text: "Inbox", icon: <MailRoundedIcon sx={iconStyle} />, link: "/inbox" },
  ];

  // Additional items only for freelancers
  const freelancerItems =
    userRole === "Freelancer"
      ? [
          {
            text: "Tax Deductions",
            icon: <ReceiptLongRoundedIcon sx={iconStyle} />,
            link: "/deductions",
          },
          {
            text: "Reimbursements",
            icon: <AttachMoneyRoundedIcon sx={iconStyle} />,
            link: "/reimbursements",
          },
          {
            text: "Tax Uploads",
            icon: <CloudUploadRoundedIcon sx={iconStyle} />,
            link: "/uploader",
          },
          {
            text: "Tax Summary",
            icon: <SummarizeRoundedIcon sx={iconStyle} />,
            link: "/tax-summary",
          },
        ]
      : [];

  const finalMainListItems = mainListItems.concat(freelancerItems);

  const secondaryListItems = [
    { text: "About", icon: <InfoRoundedIcon sx={iconStyle} />, link: "/about" },
  ];

  // Show a loading state while the user role is being fetched
  if (loading) return <div></div>;

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: "space-between" }}>
      <List dense>
        {finalMainListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: "block" }}>
            <ListItemButton
              component={Link}
              to={item.link}
              selected={location.pathname === item.link}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} sx={{ color: "white" }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <List dense>
        {secondaryListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: "block" }}>
            <ListItemButton
              component={Link}
              to={item.link}
              selected={location.pathname === item.link}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} sx={{ color: "white" }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}
