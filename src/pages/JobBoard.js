import React, { useState, useEffect } from "react";
import { ref, onValue, push, update, get } from "firebase/database"; // Firebase DB functions
import { auth, db } from "../firebase";
import "./JobBoard.css";

const JobBoard = () => {
  const [jobs, setJobs] = useState([]); // Stores jobs
  const [userRole, setUserRole] = useState(""); // Stores the user role (Employer or Contractor)
  const [currentJobId, setCurrentJobId] = useState(null); // Tracks the job currently being edited or viewed
  const [newJob, setNewJob] = useState({ title: "", description: "", payment: "", deadline: "" }); // New job data
  const [message, setMessage] = useState(""); // New message for chat
  const [messages, setMessages] = useState([]); // List of messages between employer and contractor
  const [acceptedJob, setAcceptedJob] = useState(null); // Contractor's accepted job (if any)

  // Fetch jobs and determine user role from Firebase
  useEffect(() => {
    // Fetch jobs
    const jobsRef = ref(db, "jobs/");
    onValue(jobsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setJobs(Object.entries(data)); // Convert object to array of job entries
      }
    });

    // Check user role from Firebase
    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;
      const userRef = ref(db, "users/" + userId); // Reference to user data in Firebase
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
          setUserRole(userData.role); // Set the user's role (Employer/Contractor)
        }
      });
    }
  }, []);

  // Fetch messages when entering the job board
  useEffect(() => {
    if (acceptedJob || currentJobId) {
      const jobId = acceptedJob || currentJobId;
      fetchMessages(jobId); // Fetch messages for the specific job
    }
  }, [acceptedJob, currentJobId]);

  // Function to fetch messages for a specific job from Firebase
  const fetchMessages = async (jobId) => {
    const messageRef = ref(db, `messages/${jobId}`);
    onValue(messageRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMessages(Object.values(data)); // Set fetched messages to the state
      } else {
        setMessages([]); // No messages found, clear the list
      }
    });
  };

  // Function to handle job posting by employer
  const handleJobPost = async (e) => {
    e.preventDefault();
    const userId = auth.currentUser?.uid;
    if (!userId || userRole !== "Employer") {
      alert("Only employers can post jobs.");
      return;
    }

    const jobRef = ref(db, "jobs/");
    const newJobEntry = {
      ...newJob,
      employerId: userId,
      freelancerId: null, // No freelancer yet
      status: "open",
    };

    try {
      await push(jobRef, newJobEntry);
      alert("Job posted successfully!");
      setNewJob({ title: "", description: "", payment: "", deadline: "" }); // Reset the form
    } catch (error) {
      console.error("Error posting job:", error.message);
      alert("Error posting job. Please try again.");
    }
  };

  // Handle job editing by employer
  const handleEditJob = async (jobId) => {
    const jobRef = ref(db, `jobs/${jobId}`);
    try {
      await update(jobRef, { ...newJob });
      alert("Job updated successfully!");
      setCurrentJobId(null); // Reset the editing state
    } catch (error) {
      console.error("Error updating job:", error.message);
      alert("Error updating job. Please try again.");
    }
  };

  // Contractor accepts a job
  const handleAcceptJob = async (jobId) => {
    const userId = auth.currentUser?.uid;
    if (!userId || userRole !== "Contractor") return; // Only contractors can accept jobs

    const jobRef = ref(db, `jobs/${jobId}`);
    try {
      await update(jobRef, { freelancerId: userId, status: "accepted" });
      alert("Job accepted successfully!");
      setAcceptedJob(jobId); // Set the accepted job for the contractor
      fetchMessages(jobId); // Fetch messages for the accepted job
    } catch (error) {
      console.error("Error accepting job:", error.message);
      alert("Error accepting job. Please try again.");
    }
  };

  // Handle messaging between employer and contractor
  const handleSendMessage = async (jobId) => {
    const userId = auth.currentUser?.uid;
    const messageRef = ref(db, `messages/${jobId}`);
    const newMessage = {
      senderId: userId,
      text: message,
      timestamp: Date.now(),
    };

    try {
      await push(messageRef, newMessage);
      setMessage(""); // Clear input after sending message
    } catch (error) {
      console.error("Error sending message:", error.message);
    }
  };

  return (
    <div className="job-board-container">
      <h1>{userRole === "Employer" ? "Manage Your Jobs" : "Available Jobs"}</h1>

      {/* Job Posting Form for Employers */}
      {userRole === "Employer" && (
        <form onSubmit={handleJobPost} className="job-form">
          <input
            type="text"
            placeholder="Job Title"
            value={newJob.title}
            onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Job Description"
            value={newJob.description}
            onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Hourly Rate ($)"
            value={newJob.payment}
            onChange={(e) => setNewJob({ ...newJob, payment: e.target.value })}
            required
          />
          <input
            type="date"
            placeholder="Deadline"
            value={newJob.deadline}
            onChange={(e) => setNewJob({ ...newJob, deadline: e.target.value })}
            required
          />
          <button type="submit" className="submit-btn">Post Job</button>
        </form>
      )}

      {/* List of Jobs */}
      <div className="job-list">
        {jobs.length > 0 ? (
          jobs.map(([id, job]) => (
            <div key={id} className="job-item">
              <h2>{job.title}</h2>
              <p>{job.description}</p>
              <p>Hourly Rate: ${job.payment}</p>
              <p>Deadline: {job.deadline}</p>
              <p>Status: {job.status}</p>

              {/* Employer can edit the job */}
              {userRole === "Employer" && job.employerId === auth.currentUser?.uid && (
                <>
                  <button onClick={() => setCurrentJobId(id)}>Edit Job</button>
                  {currentJobId === id && (
                    <div>
                      <input
                        type="text"
                        placeholder="Edit Job Title"
                        value={newJob.title}
                        onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                      />
                      <textarea
                        placeholder="Edit Job Description"
                        value={newJob.description}
                        onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                      />
                      <button onClick={() => handleEditJob(id)}>Save Changes</button>
                    </div>
                  )}
                  {job.freelancerId && <p>Job accepted by contractor.</p>}
                </>
              )}

              {/* Contractor can accept the job */}
              {userRole === "Contractor" && job.status === "open" && (
                <button onClick={() => handleAcceptJob(id)} className="accept-btn">
                  Accept Job
                </button>
              )}
            </div>
          ))
        ) : (
          <p>No jobs available at the moment.</p>
        )}
      </div>

      {/* Messaging system */}
      {(acceptedJob || currentJobId) && (
        <div className="message-section">
          <h2>Messages</h2>
          <div className="message-list">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message-item ${msg.senderId === auth.currentUser?.uid ? "sent" : "received"}`}>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>
          <textarea
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={() => handleSendMessage(acceptedJob || currentJobId)}>Send</button>
        </div>
      )}
    </div>
  );
};

export default JobBoard;
