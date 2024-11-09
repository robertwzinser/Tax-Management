import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { auth } from "../firebase";
import { getDatabase, ref, get, set } from "firebase/database";
import "./Profile.css";

const Profile = () => {
  const { uid } = useParams(); // Get userId from route parameter
  const [profileData, setProfileData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    profession: "",
    address: "",
    bio: "",
    rating: 0,
  });
  const [originalData, setOriginalData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Fetch profile data based on uid parameter
  useEffect(() => {
    const fetchProfileData = async () => {
      const db = getDatabase();
      const userRef = ref(db, `users/${uid}`);
      try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setProfileData(data);
          setOriginalData(data); // Store initial data in case of cancel
        } else {
          console.log("Profile data not found");
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (uid) {
      fetchProfileData();
    }
  }, [uid]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setProfileData((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  };

  const handleSave = async () => {
    if (auth.currentUser?.uid === uid) {
      const db = getDatabase();
      const userRef = ref(db, `users/${uid}`);
      try {
        await set(userRef, profileData);
        setMessage("Profile updated successfully.");
        setIsEditing(false);
        setOriginalData(profileData);
      } catch (error) {
        console.error("Error updating profile:", error);
        setMessage("Failed to update profile.");
      }
    }
  };

  const handleCancel = () => {
    setProfileData(originalData); // Revert changes to original data
    setIsEditing(false); // Exit edit mode
  };

  if (loading) return <div>Loading...</div>;

  // Determine if the current user is viewing their own profile
  const isOwnProfile = auth.currentUser?.uid === uid;

  return (
    <div className="profile-container">
      {isOwnProfile ? (
        // Editing own profile view
        <div>
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

            <label htmlFor="bio">Bio</label>
            <input
              type="text"
              id="bio"
              value={profileData.bio}
              onChange={handleChange}
              disabled={!isEditing}
            />

            <label htmlFor="rating">Rating</label>
            <input
              type="number"
              id="rating"
              value={profileData.rating}
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
      ) : (
        // Viewing another user's profile
        <div>
          <h1>{profileData.firstname} {profileData.lastname}'s Profile</h1>
          <p><strong>Email:</strong> {profileData.email}</p>
          <p><strong>Profession:</strong> {profileData.profession}</p>
          <p><strong>Address:</strong> {profileData.address}</p>
          {profileData.bio && <p><strong>Bio:</strong> {profileData.bio}</p>}
          {profileData.rating && <p><strong>Rating:</strong> {profileData.rating}</p>}
        </div>
      )}
    </div>
  );
};

export default Profile;
