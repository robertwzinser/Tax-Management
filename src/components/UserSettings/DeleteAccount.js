import {
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { ref, remove } from "firebase/database";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";

const DeleteAccount = () => {
  const navigate = useNavigate();

  const reauthenticate = async () => {
    const user = auth.currentUser;
    if (!user) return false;

    const email = user.email;
    const password = prompt(
      "Please confirm your password to delete your account:"
    );
    const credential = EmailAuthProvider.credential(email, password);

    try {
      await reauthenticateWithCredential(user, credential);
      return true;
    } catch (error) {
      console.error("Re-authentication failed:", error.message);
      alert("Re-authentication failed. Please try again.");
      return false;
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      "Are you sure you want to delete your account?"
    );
    if (confirmation) {
      try {
        const user = auth.currentUser;
        if (user) {
          const userId = user.uid;

          const reauthenticated = await reauthenticate();
          if (!reauthenticated) return;

          await remove(ref(db, "users/" + userId));
          await deleteUser(user);

          alert("Account successfully deleted.");
          navigate("/sign-in");
        }
      } catch (error) {
        console.error(
          "There was a problem deleting your account:",
          error.message
        );
        alert("There was a problem deleting your account. Please try again.");
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate("/sign-in");
    } catch (error) {
      console.error("There was a problem signing out:", error.message);
    }
  };

  return (
    <div className="links-container">
      <button onClick={handleSignOut} className="custom-btn">
        Sign Out
      </button>
      <button onClick={handleDeleteAccount} className="delete-btn">
        Delete My Account
      </button>
    </div>
  );
};

export default DeleteAccount;
