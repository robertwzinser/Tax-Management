import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { ref, get, set } from "firebase/database";
import "./Profile.css";

const Profile = () => {
  const user = auth.currentUser;
  const [profileData, setProfileData] = useState({
    firstname: "",
    lastname: "",
    email: user ? user.email : "",
    profession: "",
    address: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      // Fetch the profile data from Firebase
      const userRef = ref(db, "users/" + user.uid);
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          setProfileData(snapshot.val());
        }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setProfileData((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  };

  const handleSave = async () => {
    if (user) {
      try {
        const userRef = ref(db, "users/" + user.uid);
        await set(userRef, profileData);
        setMessage("Profile updated successfully.");
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating profile:", error);
        setMessage("Failed to update profile.");
      }
    }
  };

  return (
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

        <label htmlFor="role">Role</label>
        <input type="email" id="email" value={profileData.role} disabled />  
      </div>

      <div className="profile-actions">
        {isEditing ? (
          <button onClick={handleSave} className="save-btn">
            Save Changes
          </button>
        ) : (
          <button onClick={() => setIsEditing(true)} className="edit-btn">
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
};

export default Profile;
