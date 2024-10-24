import * as React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import { Link } from "react-router-dom"; // Import Link from react-router-dom

const iconStyle = { color: "white" }; // Set all icons to white

const mainListItems = [
  { text: "Dashboard", icon: <HomeRoundedIcon sx={iconStyle} />, link: "/" },
  {
    text: "Job Board",
    icon: <PeopleRoundedIcon sx={iconStyle} />,
    link: "/job-board",
  },
  {
    text: "Inbox",
    icon: <AnalyticsRoundedIcon sx={iconStyle} />,
    link: "/inbox",
  },
];

const secondaryListItems = [
  {
    text: "Settings",
    icon: <SettingsRoundedIcon sx={iconStyle} />,
    link: "/user-settings",
  },
  { text: "About", icon: <InfoRoundedIcon sx={iconStyle} />, link: "/about" },
];

export default function MenuContent() {
  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: "space-between" }}>
      <List dense>
        {mainListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: "block" }}>
            <ListItemButton
              component={Link}
              to={item.link}
              selected={index === 0}
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
            <ListItemButton component={Link} to={item.link}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} sx={{ color: "white" }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}
