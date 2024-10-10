import * as React from "react";
import MuiAvatar from "@mui/material/Avatar";
import MuiListItemAvatar from "@mui/material/ListItemAvatar";
import MenuItem from "@mui/material/MenuItem";
import { styled } from "@mui/material/styles";

const Avatar = styled(MuiAvatar)(({ theme }) => ({
  width: 100, // Adjusted the width
  height: 60, // Adjusted the height
  borderRadius: 0, // No border radius
  border: "none", // No border
  backgroundColor: "transparent", // Transparent background
  "&:hover": {
    backgroundColor: "transparent", // No hover effect
  },
}));

const ListItemAvatar = styled(MuiListItemAvatar)({
  display: "flex",
  justifyContent: "center", // Center horizontally
  alignItems: "center", // Center vertically
});

export default function SelectContent({ open }) {
  const [company, setCompany] = React.useState("");

  const handleChange = (event) => {
    setCompany(event.target.value);
  };

  return (
    <div
      labelid="company-select"
      id="company-simple-select"
      value={company}
      onChange={handleChange}
      sx={{
        maxHeight: 56,
        width: 215,
        "&.MuiList-root": {
          p: "8px",
        },
        [`& .MuiSelect-select`]: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center", // Center the content inside the select
          gap: "2px",
          pl: 1,
        },
      }}
    >
      <MenuItem>
        <ListItemAvatar>
          {/* Conditionally render different images based on the `open` state */}
          {open ? (
            <Avatar
              alt="Taxzilla Logo Open"
              src={require("./taxzilla.png")} // Image when sidebar is open
              sx={{
                minWidth: "200px",
                height: "68px",
                justifyContent: "center",
                marginLeft: "-3px",
              }}
            />
          ) : (
            <Avatar
              alt="Taxzilla Logo Closed"
              src={require("./taxzilla-text.png")} // Image when sidebar is closed
              sx={{
                minWidth: "200px",
                height: "68px",
                justifyContent: "center",
                marginLeft: "-2px",
              }}
            />
          )}
        </ListItemAvatar>
      </MenuItem>
    </div>
  );
}
