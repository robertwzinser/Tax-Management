/* Dark Mode Styles for the Messaging component */
.message-section {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 900px;
  margin: auto;
  background: #1e1e1e; /* Dark background for main container */
  border-radius: 15px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.7);
  overflow: hidden;
}

.header {
  padding: 15px;
  background: #2c2c2c; /* Darker background for header */
  margin: 0;
  font-size: 20px;
  text-align: center;
  color: #e0e0e0; /* Light color for header text */
  border-bottom: 1px solid #3a3a3a;
}

.selection-section {
  display: flex;
  justify-content: space-between;
  padding: 15px 20px;
  background: #2c2c2c; /* Background for dropdown section */
  border-bottom: 1px solid #3a3a3a;
}

.selection-section label {
  font-size: 16px;
  color: #b0b0b0; /* Lighter color for label text */
  font-weight: 500;
}

.selection-section select {
  padding: 8px 12px;
  margin-left: 10px;
  border: 1px solid #555;
  border-radius: 8px;
  font-size: 14px;
  background: #3a3a3a; /* Dark background for dropdown */
  color: #e0e0e0; /* Light color for text */
  transition: border-color 0.2s;
}

.selection-section select:focus {
  outline: none;
  border-color: #007bff;
}

.message-list {
  flex: 1;
  padding: 20px;
  background: #1e1e1e; /* Dark background for message area */
  overflow-y: auto;
  max-height: 400px;
}

.message-item {
  display: inline-block;
  padding: 10px 15px;
  margin: 8px 0;
  border-radius: 12px;
  max-width: 70%;
  font-size: 15px;
  line-height: 1.4;
}

.message-item.sent {
  background: #007bff; /* Blue for sent messages */
  color: #ffffff;
  margin-left: auto;
  border-bottom-right-radius: 0;
}

.message-item.received {
  background: #3a3a3a; /* Dark grey for received messages */
  color: #e0e0e0;
  margin-right: auto;
  border-bottom-left-radius: 0;
}

textarea {
  width: 100%;
  padding: 12px;
  font-size: 14px;
  border: 1px solid #555;
  background: #2c2c2c; /* Dark background for input */
  color: #e0e0e0; /* Light color for text */
  border-radius: 10px;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

textarea:focus {
  border-color: #007bff;
}

.send-btn {
  background: #007bff; /* Blue for the send button */
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.3s;
}

.send-btn:hover {
  background: #0056b3; /* Slightly darker blue on hover */
}

.send-btn:disabled {
  background: #555;
  cursor: not-allowed;
}
