import React, { useState, useEffect } from "react";
import { ref, onValue, push } from "firebase/database";
import { auth, db } from "../firebase";
import './Messaging.css';

const Messaging = () => {
  const [employers, setEmployers] = useState([]);
  const [freelancers, setFreelancers] = useState([]);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const userId = auth.currentUser?.uid;
  const [userRole, setUserRole] = useState("");

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

  // Fetch employers for freelancers or freelancers for employers
  useEffect(() => {
    if (userRole === "Freelancer") {
      const freelancerRef = ref(db, `users/${userId}/linkedEmployers`);
      onValue(freelancerRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setEmployers(Object.entries(data));
        }
      });
    } else if (userRole === "Employer") {
      const employerRef = ref(db, `users`);
      onValue(employerRef, (snapshot) => {
        const users = snapshot.val();
        const freelancersList = Object.entries(users)
          .filter(([id, user]) => user.role === "Freelancer")
          .map(([id, freelancerData]) => ({
            freelancerId: id,
            freelancerName: `${freelancerData.firstname} ${freelancerData.lastname}`,
          }));
        setFreelancers(freelancersList);
      });
    }
  }, [userRole, userId]);

  // Fetch messages for the selected employer or freelancer
  useEffect(() => {
    if (selectedEmployer || selectedFreelancer) {
      setMessages([]); // Reset messages when selecting a new employer or freelancer

      let messagesRef;
      if (userRole === "Freelancer") {
        messagesRef = ref(db, `messages/${selectedEmployer}/${userId}`);
      } else if (userRole === "Employer") {
        messagesRef = ref(db, `messages/${userId}/${selectedFreelancer}`);
      }

      onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setMessages(Object.values(data));
        } else {
          setMessages([]); // Clear messages if no data
        }
      });
    }
  }, [selectedEmployer, selectedFreelancer, userRole, userId]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (selectedEmployer || selectedFreelancer) {
      let messageRef;
      if (userRole === "Freelancer") {
        messageRef = ref(db, `messages/${selectedEmployer}/${userId}`);
      } else if (userRole === "Employer") {
        messageRef = ref(db, `messages/${userId}/${selectedFreelancer}`);
      }

      const newMessage = {
        senderId: userId,
        text: message,
        timestamp: Date.now(),
      };

      try {
        await push(messageRef, newMessage);
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
              <option value="" disabled>Select Employer</option>
              {employers.map(([id, employer]) => (
                <option key={id} value={id}>{employer.name}</option>
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
              <option value="" disabled>Select Freelancer</option>
              {freelancers.map(({ freelancerId, freelancerName }) => (
                <option key={freelancerId} value={freelancerId}>{freelancerName}</option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="message-list">
        {messages.length > 0 ? (
          messages.map((msg, idx) => (
            <div key={idx} className={`message-item ${msg.senderId === userId ? "sent" : "received"}`}>
              <p>{msg.text}</p>
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
        className="send-btn"
        onClick={handleSendMessage}
        disabled={!selectedEmployer && !selectedFreelancer}
      >
        Send
      </button>
    </div>
  );
};

export default Messaging;
