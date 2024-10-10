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
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";

const iconStyle = { color: "white" }; // Set all icons to white

const mainListItems = [
  { text: "Dashboard", icon: <HomeRoundedIcon sx={iconStyle} /> },
  { text: "Job Board", icon: <PeopleRoundedIcon sx={iconStyle} /> },
  { text: "Analytics", icon: <AnalyticsRoundedIcon sx={iconStyle} /> },
];

const secondaryListItems = [
  { text: "Settings", icon: <SettingsRoundedIcon sx={iconStyle} /> },
  { text: "About", icon: <InfoRoundedIcon sx={iconStyle} /> },
  { text: "Feedback", icon: <HelpRoundedIcon sx={iconStyle} /> },
];

export default function MenuContent() {
  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: "space-between" }}>
      <List dense>
        {mainListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: "block" }}>
            <ListItemButton selected={index === 0}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} sx={{ color: "white" }} />{" "}
              {/* Set text color to white */}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <List dense>
        {secondaryListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: "block" }}>
            <ListItemButton>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} sx={{ color: "white" }} />{" "}
              {/* Set text color to white */}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}
