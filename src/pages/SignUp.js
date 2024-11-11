import { useState, useEffect } from "react";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { ref, set, onValue } from "firebase/database";
import "./SignUp.css";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [states, setStates] = useState([]); 
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    role: "",
    businessName: "",
    state: "",
  });

  const navigate = useNavigate();
  const { firstname, lastname, email, password, role, businessName, state } =
    formData;

  useEffect(() => {
    // Fetch states from the database for the dropdown
    const statesRef = ref(db, "statesCollection");
    onValue(statesRef, (snapshot) => {
      const stateData = snapshot.val();
      const stateOptions = stateData
        ? Object.keys(stateData).map((key) => ({
            name: key,
            taxRate: stateData[key].taxRate,
          }))
        : [];
      setStates(stateOptions);
    });
  }, []);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (role === "") {
      alert("Please select an account type.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userData = {
        firstname,
        lastname,
        email,
        role,
        state,
      };

      if (role === "Employer") {
        userData.businessName = businessName;
      }

      await set(ref(db, `users/${user.uid}`), userData);

      alert("User registered successfully!");
      navigate("/sign-in");
    } catch (error) {
      console.error("Error during registration:", error.message);
    }
  };

  return (
    <section className="sign-up-container">
      <div className="sign-up-box">
        <h1>Sign Up</h1>
        <form onSubmit={onSubmit}>
          <input
            type="text"
            id="firstname"
            value={firstname}
            onChange={onChange}
            placeholder="First Name"
          />
          <input
            type="text"
            id="lastname"
            value={lastname}
            onChange={onChange}
            placeholder="Last Name"
          />
          <input
            type="email"
            id="email"
            value={email}
            onChange={onChange}
            placeholder="Email address"
          />
          <div className="password-input-container">
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
                onClick={() => setShowPassword(!showPassword)}
              />
            ) : (
              <AiFillEye
                className="password-toggle-icon"
                onClick={() => setShowPassword(!showPassword)}
              />
            )}
          </div>
          <div className="roleselector">
            <select
              style={{ marginTop: "10px" }}
              onChange={onChange}
              id="role"
              value={role}
              required
            >
              <option value="">Select an account type</option>
              <option value="Employer">Employer</option>
              <option value="Freelancer">Freelancer</option>
            </select>
          </div>
          {role === "Employer" && (
            <input
              type="text"
              id="businessName"
              value={businessName}
              onChange={onChange}
              placeholder="Business Name"
              required
            />
          )}
          {role === "Freelancer" && (
            <div className="roleselector">
              <select id="state" value={state} onChange={onChange} required>
                <option value="">Select your state</option>
                {states.map((option) => (
                  <option key={option.name} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button className="custom-btn" type="submit">
            Register
          </button>
        </form>
        <div className="link-container">
          <p className="sign-in-text">
            Already have an account? <Link to="/sign-in">Sign In!</Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default SignUp;
