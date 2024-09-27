import { useState } from "react";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "../firebase";
import "./SignIn.css";

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const { email, password, role } = formData;
  const navigate = useNavigate(); 

  // Update form data when typing
  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  };

  // Sign-in user with Firebase Authentication
  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      // Authenticate user with email and password
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Get first name from Realtime Database
      const userRef = ref(db, "users/" + user.uid);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        const firstname = userData.firstname;

        if (role === "employer") {
          console.log("EmployerRoute");
          navigate("/dashboard", { state: { firstname } });
        } else {
          console.log("FreelancerRoute");
          navigate("/dashboard", { state: { firstname } });
        }
      } else {
        console.error("User is non-existent in Realtime Database");
      }
    } catch (error) {
      setErrorMessage(`Error: ${error.message}`);
      console.error("There was a problem signing you in:", error.message);
    }
  };

  return (
    <section className="sign-in-container">
      <div className="sign-in-box">
        <h1>Sign In</h1>

        {/* Display error message if problem signing user in */}
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <form onSubmit={onSubmit}>
          {/* User inputs email */}
          <input
            type="email"
            id="email"
            value={email}
            onChange={onChange}
            placeholder="Email address"
          />

          <div className="password-input-container">
            {/* user inputs password */}
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={onChange}
              placeholder="Password"
            />

            {showPassword ? (
              <AiFillEyeInvisible
                className="password-toggle-icon"
                onClick={() => setShowPassword((prevState) => !prevState)}
              />
            ) : (
              <AiFillEye
                className="password-toggle-icon"
                onClick={() => setShowPassword((prevState) => !prevState)}
              />
            )}
          </div>

          {/* Submit button */}
          <button type="submit">Sign in</button>

          {/* Links container */}
          <div className="link-container">
            <p className="register-text">
              Need an account? <Link to="/sign-up">Register here!</Link>
            </p>
            <p className="forgot-password-text">
              <Link to="/forgot-password">Forgot Password?</Link>
            </p>
          </div>
        </form>
      </div>
    </section>
  );
};

export default SignIn;
