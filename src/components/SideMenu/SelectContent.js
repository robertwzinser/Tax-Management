import * as React from "react";
import MuiAvatar from "@mui/material/Avatar";
import MuiListItemAvatar from "@mui/material/ListItemAvatar";
import MenuItem from "@mui/material/MenuItem";
import { styled } from "@mui/material/styles";

const Avatar = styled(MuiAvatar)(({ theme }) => ({
  width: 100, 
  height: 60, 
  borderRadius: 0, 
  border: "none", 
  backgroundColor: "transparent", 
  "&:hover": {
    backgroundColor: "transparent", 
  },
}));

const ListItemAvatar = styled(MuiListItemAvatar)({
  display: "flex",
  justifyContent: "center", 
  alignItems: "center",
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
          justifyContent: "center", 
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
