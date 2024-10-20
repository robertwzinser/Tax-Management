import React, { useState, useEffect } from "react";
import { ref, onValue, push, get } from "firebase/database";
import { auth, db } from "../firebase";

const Messaging = () => {
  const [employers, setEmployers] = useState([]);
  const [freelancers, setFreelancers] = useState([]);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const userId = auth.currentUser?.uid;
  const [userRole, setUserRole] = useState("");

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
      const freelancerRef = ref(db, `users/${userId}/linkedEmployers`);
      onValue(freelancerRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setEmployers(Object.entries(data));
        }
      });
    } else if (userRole === "Employer") {
      const employerRef = ref(db, `jobs/`);
      onValue(employerRef, async (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const freelancerSet = new Set();
          const freelancerList = await Promise.all(
            Object.entries(data)
              .filter(([_, job]) => job.employerId === userId && job.freelancerId)
              .map(async ([id, job]) => {
                if (!freelancerSet.has(job.freelancerId)) {
                  freelancerSet.add(job.freelancerId);
                  const freelancerRef = ref(db, `users/${job.freelancerId}`);
                  const freelancerSnapshot = await get(freelancerRef);
                  const freelancerData = freelancerSnapshot.val();
                  const freelancerName = freelancerData 
                    ? `${freelancerData.firstname} ${freelancerData.lastname}` 
                    : "Unknown Freelancer";
                  return {
                    freelancerId: job.freelancerId,
                    freelancerName: freelancerName,
                  };
                }
                return null;
              })
          );
          setFreelancers(freelancerList.filter(Boolean));
        }
      });
    }
  }, [userRole, userId]);

  useEffect(() => {
    if (selectedEmployer || selectedFreelancer) {
      const jobsRef = ref(db, "jobs/");
      onValue(jobsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const filteredJobs = Object.entries(data).filter(
            ([_, job]) =>
              (selectedEmployer && job.employerId === selectedEmployer) ||
              (selectedFreelancer && job.freelancerId === selectedFreelancer)
          );
          setJobs(filteredJobs);
        }
      });
    }
  }, [selectedEmployer, selectedFreelancer]);

  useEffect(() => {
    if (selectedJob) {
      const { jobId, employerId, freelancerId } = selectedJob;
      const messagesRef = ref(db, `messages/${employerId}/${freelancerId}/${jobId}`);
      onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setMessages(Object.values(data));
        } else {
          setMessages([]);
        }
      });
    }
  }, [selectedJob]);

  const handleSendMessage = async () => {
    if (selectedJob) {
      const { jobId, employerId, freelancerId } = selectedJob;
      const messageRef = ref(db, `messages/${employerId}/${freelancerId}/${jobId}`);
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
      <h2 className="header">Messages</h2>
      <div className="selection-section">
        {userRole === "Freelancer" && (
          <>
            <label>Select Employer:</label>
            <select onChange={(e) => setSelectedEmployer(e.target.value)} value={selectedEmployer || ""}>
              <option value="" disabled>Select Employer</option>
              {employers.map(([id, employer]) => (
                <option key={id} value={id}>{employer.name}</option>
              ))}
            </select>
          </>
        )}

        {userRole === "Employer" && (
          <>
            <label>Select Freelancer:</label>
            <select onChange={(e) => setSelectedFreelancer(e.target.value)} value={selectedFreelancer || ""}>
              <option value="" disabled>Select Freelancer</option>
              {freelancers.map(({ freelancerId, freelancerName }) => (
                <option key={freelancerId} value={freelancerId}>{freelancerName}</option>
              ))}
            </select>
          </>
        )}

        {jobs.length > 0 && (
          <>
            <label>Select Job:</label>
            <select onChange={(e) => setSelectedJob(JSON.parse(e.target.value))} value={selectedJob ? JSON.stringify(selectedJob) : ""}>
              <option value="" disabled>Select Job</option>
              {jobs.map(([id, job]) => (
                <option key={id} value={JSON.stringify({ jobId: id, employerId: job.employerId, freelancerId: job.freelancerId })}>
                  {job.title}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="message-list">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-item ${msg.senderId === userId ? "sent" : "received"}`}>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>

      <textarea placeholder="Type your message..." value={message} onChange={(e) => setMessage(e.target.value)} />
      <button className="send-btn" onClick={handleSendMessage} disabled={!selectedJob}>
        Send
      </button>
    </div>
  );
};

export default Messaging;
