import { useState } from "react";
import {
  PhoneAuthProvider,
  RecaptchaVerifier,
  EmailAuthProvider,
  PhoneMultiFactorGenerator,
  reauthenticateWithCredential,
} from "firebase/auth";
import { auth } from "../../firebase";

const MFASetup = ({ isEmailVerified }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [recaptchaInitialized, setRecaptchaInitialized] = useState(false);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier && !recaptchaInitialized) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: (response) => {
            console.log("Recaptcha solved", response);
          },
          "expired-callback": () => {
            console.log("Recaptcha expired, resetting...");
            setRecaptchaInitialized(false);
          },
        }
      );
      setRecaptchaInitialized(true);
    }
  };

  const sendVerificationCode = async () => {
    setupRecaptcha();
    const phoneAuthProvider = new PhoneAuthProvider(auth);
    try {
      const formattedPhoneNumber = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+1${phoneNumber}`; // Assuming +1 for US region
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        formattedPhoneNumber,
        window.recaptchaVerifier
      );
      setConfirmationResult(verificationId);
      console.log("Verification code sent to phone:", formattedPhoneNumber);
    } catch (error) {
      console.error("Error sending verification code:", error.message);
    }
  };

  const verifyCodeAndEnroll = async () => {
    const user = auth.currentUser;

    if (!user) {
      alert("User is not signed in.");
      return;
    }

    // Reauthenticate user if necessary
    const password = prompt("Please enter your password for reauthentication:");
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    // Enroll in MFA
    try {
      const phoneCredential = PhoneAuthProvider.credential(
        confirmationResult,
        verificationCode
      );
      const multiFactorAssertion =
        PhoneMultiFactorGenerator.assertion(phoneCredential);
      await user.multiFactor.enroll(multiFactorAssertion, "Phone number");
      alert("MFA set up successfully!");
    } catch (error) {
      console.error("Error during MFA setup:", error.message);
    }
  };

  if (!isEmailVerified) return null;

  return (
    <div>
      <h2>Enable Multi-Factor Authentication (MFA)</h2>
      <input
        type="text"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="Enter your phone number"
      />
      <button onClick={sendVerificationCode} className="dashboard-btn">
        Send Verification Code
      </button>

      {confirmationResult && (
        <>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter Verification Code"
          />
          <button onClick={verifyCodeAndEnroll} className="dashboard-btn">
            Verify Code & Enroll
          </button>
        </>
      )}

      <div id="recaptcha-container"></div>
    </div>
  );
};

export default MFASetup;
