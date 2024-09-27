import { auth } from "../../firebase";
import { sendEmailVerification } from "firebase/auth";
import React from "react";

const EmailVerification = ({ isEmailVerified }) => {
  const sendEmailVerificationLink = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await sendEmailVerification(user);
        alert("Verification email sent. Please check your inbox.");
      } catch (error) {
        console.error("Error sending verification email:", error.message);
        alert("Error sending verification email. Please try again.");
      }
    }
  };

  if (isEmailVerified) return null;

  return (
    <div>
      <h2 style={{ textAlign: "center" }}>Your email is not verified.</h2>
      <button onClick={sendEmailVerificationLink} className="custom-btn">
        Send Verification Email
      </button>
    </div>
  );
};

export default EmailVerification;
