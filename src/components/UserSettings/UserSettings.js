import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase";
import { ref, get } from "firebase/database";
import EmailVerification from "./EmailVerification";
import MFASetup from "./MFASetup";
import DeleteAccount from "./DeleteAccount";
import "./UserSettings.css";

const UserSettings = () => {
  const [firstname, setFirstname] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthState = () => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            await user.reload();
            setIsEmailVerified(user.emailVerified);

            // Fetch user's first name from Firebase Realtime Database
            const userId = user.uid;
            const userRef = ref(db, `users/${userId}`);
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
              const userData = snapshot.val();
              setFirstname(userData.firstname || "User");
            } else {
              console.error("User data not found in Realtime Database");
            }
          } catch (error) {
            console.error("Error loading user data:", error);
          } finally {
            setLoading(false); // Set loading to false once data is fetched
          }
        }
      });
    };

    checkAuthState();
  }, []);

  // display content after loading is complete
  if (loading) {
    return <p></p>;
  }

  return (
    <div className="settings-container">
      <h1>My Settings</h1>

      <div className="user-settings-info">
        {/* Sections for MFA, Email Verification, etc. */}
        <EmailVerification isEmailVerified={isEmailVerified} />
        <MFASetup isEmailVerified={isEmailVerified} />
        <DeleteAccount />
      </div>
    </div>
  );
};

export default UserSettings;
