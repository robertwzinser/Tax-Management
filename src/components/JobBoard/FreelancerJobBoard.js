import React, { useState } from "react";
import { ref, update, get } from "firebase/database";
import { auth, db } from "../../firebase";
import "./JobBoard.css"; // Import the same CSS file

const FreelancerJobBoard = ({ jobs, setMessages }) => {
  const [acceptedJob, setAcceptedJob] = useState(null);
  const [message, setMessage] = useState("");

  const handleAcceptJob = async (jobId) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return; // Only freelancers can accept jobs

    const jobRef = ref(db, `jobs/${jobId}`);
    const freelancerRef = ref(db, `users/${userId}/linkedEmployers`);

    try {
      await update(jobRef, { freelancerId: userId, status: "accepted" });

      const jobData = (await get(jobRef)).val();
      if (jobData) {
        const employerId = jobData.employerId;
        const employerRef = ref(db, `users/${employerId}`);
        const employerData = (await get(employerRef)).val();

        const employerName = `${employerData.businessName}`;
        const freelancerData = (await get(freelancerRef)).val();

        const updatedEmployers = freelancerData
          ? { ...freelancerData, [employerId]: { name: employerName } }
          : { [employerId]: { name: employerName } };

        await update(freelancerRef, updatedEmployers);
      }

      alert("Job accepted successfully!");
      setAcceptedJob(jobId);
    } catch (error) {
      console.error("Error accepting job:", error.message);
      alert("Error accepting job. Please try again.");
    }
  };

  return (
    <div>
      <h1>Available Jobs</h1>
      <div className="job-list">
        {jobs.length > 0 ? (
          jobs.map(([id, job]) => (
            <div key={id} className="job-item">
              <h2>{job.title}</h2>
              <p>{job.description}</p>
              <p>Hourly Rate: ${job.payment}</p>
              <p>Deadline: {job.deadline}</p>
              <p>Status: {job.status}</p>
              {job.status === "open" && (
                <button
                  onClick={() => handleAcceptJob(id)}
                  className="accept-btn"
                >
                  Accept Job
                </button>
              )}
            </div>
          ))
        ) : (
          <p>No jobs available at the moment.</p>
        )}
      </div>
    </div>
  );
};

export default FreelancerJobBoard;
