import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth"; // Import listener for auth state
import { auth, db } from "../firebase";
import { ref, get, set } from "firebase/database";
import "./Profile.css";

const Profile = () => {
  const [profileData, setProfileData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    profession: "",
    address: "",
  });
  const [originalData, setOriginalData] = useState({}); // Store original profile data for cancel action
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true); // Loading state

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Fetch the profile data from Firebase after user is authenticated
        const userRef = ref(db, "users/" + user.uid);
        get(userRef)
          .then((snapshot) => {
            if (snapshot.exists()) {
              const data = {
                ...snapshot.val(),
                email: user.email, // Set email from the authenticated user
              };
              setProfileData(data);
              setOriginalData(data); // Store the original data for cancel action
            }
            setLoading(false); // Stop loading after fetching data
          })
          .catch((error) => {
            console.error("Error fetching profile:", error);
            setLoading(false); // Handle error and stop loading
          });
      } else {
        setLoading(false); // Stop loading if no user is authenticated
      }
    });

    return () => unsubscribe(); // Cleanup the listener
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setProfileData((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userRef = ref(db, "users/" + user.uid);
        await set(userRef, profileData);
        setMessage("Profile updated successfully.");
        setIsEditing(false);
        setOriginalData(profileData); // Update original data after successful save
      } catch (error) {
        console.error("Error updating profile:", error);
        setMessage("Failed to update profile.");
      }
    }
  };

  const handleCancel = () => {
    setProfileData(originalData); // Revert changes to the original data
    setIsEditing(false); // Exit edit mode
  };

  if (loading) {
    return <div></div>;
  }

  return (
    <div>
      <div className="profile-container">
        <h1>My Profile</h1>

        {message && <p className="message">{message}</p>}

        <div className="profile-info">
          <label htmlFor="firstname">First Name</label>
          <input
            type="text"
            id="firstname"
            value={profileData.firstname}
            onChange={handleChange}
            disabled={!isEditing}
          />

          <label htmlFor="lastname">Last Name</label>
          <input
            type="text"
            id="lastname"
            value={profileData.lastname}
            onChange={handleChange}
            disabled={!isEditing}
          />

          <label htmlFor="email">Email</label>
          <input type="email" id="email" value={profileData.email} disabled />

          <label htmlFor="profession">Profession</label>
          <input
            type="text"
            id="profession"
            value={profileData.profession}
            onChange={handleChange}
            disabled={!isEditing}
          />

          <label htmlFor="address">Address</label>
          <input
            type="text"
            id="address"
            value={profileData.address}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>

        <div className="profile-actions">
          {isEditing ? (
            <>
              <button onClick={handleSave} className="save-btn">
                Save Changes
              </button>
              <button onClick={handleCancel} className="cancel-btn">
                Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="edit-btn">
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
