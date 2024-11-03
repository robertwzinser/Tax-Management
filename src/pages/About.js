import React from "react";
import { Typography, Container, Avatar } from "@mui/material";
import { styled } from "@mui/system";

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: "50px",
  backgroundColor: "#1e1e1e",
  color: "#e0e0e0",
  borderRadius: "12px",
  textAlign: "center",
}));

const AboutPage = () => {
  return (
    <StyledContainer sx={{ mt: 8 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: "bold" }}>
        About Us
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Welcome to our platform! We strive to provide the best solutions for our
        users. Our mission is to create an intuitive and powerful platform for
        everyone.
      </Typography>
      <Typography variant="body2" sx={{ mt: 4, color: "#888" }}>
        For any inquiries, feel free to reach out.
      </Typography>
    </StyledContainer>
  );
};

export default AboutPage;
