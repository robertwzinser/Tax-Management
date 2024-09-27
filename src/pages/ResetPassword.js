import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import { auth } from "../firebase";

function ResetPassword() {
  const [email, setEmail] = useState("");

  const handlepasswordreset = () => {
    if (!email) console.log("Enter an email");
    else {
      sendPasswordResetEmail(auth, email);
    }
  };
  return (
    <div>
      <form>
        <input
          value={email}
          placeholder="Enter your email"
          onChange={(e) => setEmail(e.target.value)}
        ></input>
        <button onClick={handlepasswordreset}>Reset Password</button>
      </form>
    </div>
  );
}
export default ResetPassword;
