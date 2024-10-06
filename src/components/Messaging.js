import React, { useState, useEffect } from "react";
import { ref, onValue, push } from "firebase/database"; // Firebase DB functions
import { auth, db } from "../firebase"; // Ensure your Firebase is properly configured

const Messaging = ({ employerId, contractorId, jobId }) => {
  const [messages, setMessages] = useState([]); // Messages for the specific job
  const [message, setMessage] = useState(""); // New message input
  const userId = auth.currentUser?.uid; // Current logged-in user ID

  // Fetch messages from Firebase based on employer, contractor, and jobId
  useEffect(() => {
    const messagesRef = ref(db, `messages/${employerId}/${contractorId}/${jobId}`);
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMessages(Object.values(data)); // Convert object to array
      } else {
        setMessages([]); // If no messages, clear the list
      }
    });
  }, [employerId, contractorId, jobId]);

  // Handle sending messages to Firebase
  const handleSendMessage = async () => {
    const messageRef = ref(db, `messages/${employerId}/${contractorId}/${jobId}`);
    const newMessage = {
      senderId: userId,
      text: message,
      timestamp: Date.now(),
    };

    try {
      await push(messageRef, newMessage); // Push message to Firebase
      setMessage(""); // Clear input after sending message
    } catch (error) {
      console.error("Error sending message:", error.message);
    }
  };

  return (
    <div className="message-section">
      <h2>Messages</h2>
      <div className="message-list">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-item ${msg.senderId === userId ? "sent" : "received"}`}>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>

      <textarea
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button className="send-btn" onClick={handleSendMessage}>Send</button>
    </div>
  );
};

export default Messaging;
