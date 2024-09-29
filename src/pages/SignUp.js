import { useState } from "react";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { ref, set } from "firebase/database"; 
import "./SignUp.css";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    role: "Employer",
  });

  const navigate = useNavigate(); 
  const { firstname, lastname, email, password, role } = formData;

  // Update text in back-end when typing in form data
  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  };

  // Register user with Firebase auth and store additional data in Realtime Database
  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Store user details in Realtime Database
      await set(ref(db, "users/" + user.uid), {
        firstname,
        lastname,
        email,
        role
      });

      // Show browser confirmation popup
      const confirmation = window.confirm(
        "User registered successfully! Redirect to the sign-in page?"
      );
      if (confirmation) {
        // Redirect to sign-in page if they click "Ok"
        navigate("/sign-in");
      } else {
        // Stay on the current page if they click "Cancel"
        console.log("User chose to stay on the current page.");
      }
    } catch (error) {
      console.error("Error during registration:", error.message);
    }
  };

  return (
    <section className="sign-up-container">
      <div className="sign-up-box">
        <h1>Sign Up</h1>

        <form onSubmit={onSubmit}>
          {/* First Name input */}
          <input
            type="text"
            id="firstname"
            value={firstname}
            onChange={onChange}
            placeholder="First Name"
          />

          {/* Last Name input */}
          <input
            type="text"
            id="lastname"
            value={lastname}
            onChange={onChange}
            placeholder="Last Name"
          />

          {/* Email input */}
          <input
            type="email"
            id="email"
            value={email}
            onChange={onChange}
            placeholder="Email address"
          />

          <div className="password-input-container">
            {/* Password input */}
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={onChange}
              placeholder="Password"
            />

            {/* Show/hide password icon */}
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

          {/* Universal submit button */}
          <button type="submit">Register</button>
        </form>

        {/* Links container */}
        <div className="link-container">
          <p className="sign-in-text">
            Already have an account? <Link to="/sign-in">Sign In!</Link>
          </p>
        </div>
        <div class="roleselector">
          <select onChange={onChange} id="role" value={role}>
            <option value="Employer">Employer</option>
            <option value="Freelancer">Freelancer</option>
          </select>
        </div>
      </div>
    </section>
  );
};

export default SignUp;
