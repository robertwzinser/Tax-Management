import React, { useState, useEffect } from "react";
import { ref, onValue, push } from "firebase/database";
import { auth, db } from "../../firebase";
import "./Messaging.css";

const Messaging = () => {
  const [employers, setEmployers] = useState([]);
  const [freelancers, setFreelancers] = useState([]);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const userId = auth.currentUser?.uid;
  const [userRole, setUserRole] = useState("");

  // Utility function to format timestamps
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Fetch user role (freelancer or employer)
  useEffect(() => {
    const userRef = ref(db, `users/${userId}`);
    onValue(userRef, (snapshot) => {
      const userData = snapshot.val();
      if (userData) {
        setUserRole(userData.role);
      }
    });
  }, [userId]);

  useEffect(() => {
    if (userRole === "Freelancer") {
      // Fetch linked employers with accepted status and display full name
      const freelancerRef = ref(db, `users/${userId}/linkedEmployers`);
      onValue(freelancerRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const acceptedEmployers = Object.entries(data)
            .filter(([_, employer]) => employer.status === "accepted")
            .map(([id, employer]) => ({
              employerId: id,
              employerName: `${employer.firstName || ''} ${employer.lastName || ''}`.trim() || employer.name || "Unknown Employer",
            }));
          setEmployers(acceptedEmployers);
        }
      });
    } else if (userRole === "Employer") {
      // Fetch accepted freelancers for the employer
      const employerRef = ref(db, `users/${userId}/acceptedFreelancers`);
      onValue(employerRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const acceptedFreelancersList = Object.entries(data)
            .filter(([_, freelancer]) => freelancer.status === "accepted")
            .map(([id, freelancer]) => ({
              freelancerId: id,
              freelancerName: freelancer.name || `${freelancer.firstName || ''} ${freelancer.lastName || ''}`.trim() || "Unknown Freelancer",
            }));
          setFreelancers(acceptedFreelancersList);
        }
      });
    }
  }, [userRole, userId]);
  

  // Fetch messages for the selected employer or freelancer
  useEffect(() => {
    if (selectedEmployer || selectedFreelancer) {
      setMessages([]); // Reset messages when selecting a new employer or freelancer

      let messagesRef;
      if (userRole === "Freelancer" && selectedEmployer) {
        messagesRef = ref(db, `messages/${selectedEmployer}/${userId}`);
      } else if (userRole === "Employer" && selectedFreelancer) {
        messagesRef = ref(db, `messages/${userId}/${selectedFreelancer}`);
      }

      onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        setMessages(data ? Object.values(data) : []);
      });
    }
  }, [selectedEmployer, selectedFreelancer, userRole, userId]);

  // Handle sending a message and adding a notification for the recipient
  const handleSendMessage = async () => {
    if (selectedEmployer || selectedFreelancer) {
      let messageRef, notificationRef, recipientId, recipientName;

      // Define paths based on user role
      if (userRole === "Freelancer" && selectedEmployer) {
        messageRef = ref(db, `messages/${selectedEmployer}/${userId}`);
        notificationRef = ref(db, `notifications/${selectedEmployer}`);
        recipientId = selectedEmployer;
        recipientName = employers.find((emp) => emp.employerId === selectedEmployer)?.employerName;
      } else if (userRole === "Employer" && selectedFreelancer) {
        messageRef = ref(db, `messages/${userId}/${selectedFreelancer}`);
        notificationRef = ref(db, `notifications/${selectedFreelancer}`);
        recipientId = selectedFreelancer;
        recipientName = freelancers.find((fl) => fl.freelancerId === selectedFreelancer)?.freelancerName;
      }

      const newMessage = {
        senderId: userId,
        text: message,
        timestamp: Date.now(),
      };

      const userRef = ref(db, `users/${userId}`);
      let senderName = "User";
      await new Promise((resolve) => {
        onValue(
          userRef,
          (snapshot) => {
            const userData = snapshot.val();
            if (userData) {
              senderName = `${userData.firstname} ${userData.lastname}`;
            }
            resolve();
          },
          { onlyOnce: true }
        );
      });

      const notification = {
        message: `New message from ${senderName}`,
        fromId: userId,
        fromName: senderName,
        toId: recipientId,
        toName: recipientName,
        timestamp: Date.now(),
        type: "message",
      };

      try {
        // Push the new message to the database
        await push(messageRef, newMessage);

        // Push the notification to the recipient's notifications
        await push(notificationRef, notification);

        // Clear the message input field
        setMessage("");
      } catch (error) {
        console.error("Error sending message:", error.message);
      }
    }
  };

  return (
    <div className="message-section">
      <h2 className="header">Inbox</h2>
      <div className="selection-section">
  {userRole === "Freelancer" && (
    <>
      <label>Employer:</label>
      <select
        onChange={(e) => setSelectedEmployer(e.target.value)}
        value={selectedEmployer || ""}
      >
        <option value="" disabled>
          Select Employer
        </option>
        {employers.map(({ employerId, employerName }) => (
          <option key={employerId} value={employerId}>
            {employerName}
          </option>
        ))}
      </select>
    </>
  )}
  {userRole === "Employer" && (
    <>
      <label>Freelancer:</label>
      <select
        onChange={(e) => setSelectedFreelancer(e.target.value)}
        value={selectedFreelancer || ""}
      >
        <option value="" disabled>
          Select Freelancer
        </option>
        {freelancers.map(({ freelancerId, freelancerName }) => (
          <option key={freelancerId} value={freelancerId}>
            {freelancerName}
          </option>
        ))}
      </select>
    </>
  )}
</div>


      <div className="message-list">
        {messages.length > 0 ? (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message-item ${
                msg.senderId === userId ? "sent" : "received"
              }`}
            >
              <p>{msg.text}</p>
              <span className="timestamp" style={{ fontSize: "10px" }}>
                {formatTimestamp(msg.timestamp)}
              </span>
            </div>
          ))
        ) : (
          <p className="no-messages">No messages yet.</p>
        )}
      </div>

      <textarea
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        className="job-button"
        onClick={handleSendMessage}
        disabled={!selectedEmployer && !selectedFreelancer}
      >
        Send
      </button>
    </div>
  );
};

export default Messaging;
