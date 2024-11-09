import React, { useState } from "react";
import { ref, set, get, push } from "firebase/database";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import "./JobBoard.css"; // Import the same CSS file

const FreelancerJobBoard = ({ jobs, setMessages }) => {
  const [acceptedJob, setAcceptedJob] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleRequestJob = async (jobId) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const jobRef = ref(db, `jobs/${jobId}`);
    const requestRef = ref(db, `jobs/${jobId}/requests/${userId}`);
    const freelancerRef = ref(db, `users/${userId}`);

    try {
      const freelancerData = (await get(freelancerRef)).val();
      const freelancerName = `${freelancerData.firstname} ${freelancerData.lastname}`;

      await set(requestRef, {
        status: "requested",
        freelancerId: userId,
        freelancerName,
      });

      const jobData = (await get(jobRef)).val();
      const employerId = jobData.employerId;
      const notificationRef = ref(db, `notifications/${employerId}`);
      await push(notificationRef, {
        type: "job-request",
        message: `New job request from ${freelancerName}.`,
        fromName: freelancerName,
        freelancerId: userId,
        jobId,
        timestamp: Date.now(),
        redirectUrl: "/job-board",
      });

      alert("Job request sent successfully.");
    } catch (error) {
      console.error("Error sending job request:", error.message);
      alert("Error sending job request. Please try again.");
    }
  };
  
  
  // const handleAcceptJob = async (jobId) => {
  //   const userId = auth.currentUser?.uid;
  //   if (!userId) return; // Only freelancers can accept jobs
  
  //   const jobRef = ref(db, `jobs/${jobId}`);
  //   const freelancerRef = ref(db, `users/${userId}`);
  
  //   try {
  //     // Fetch freelancer data from Firebase
  //     const freelancerSnapshot = await get(freelancerRef);
  //     const freelancerData = freelancerSnapshot.val();
  
  //     if (!freelancerData) {
  //       alert("Freelancer data not found.");
  //       return;
  //     }
  
  //     // Fetch job data to retrieve the employer ID
  //     const jobData = (await get(jobRef)).val();
  //     if (!jobData) {
  //       alert("Job data not found.");
  //       return;
  //     }
  
  //     const employerId = jobData.employerId;
  //     const employerRef = ref(db, `users/${employerId}`);
  
  //     // Fetch employer data from Firebase
  //     const employerSnapshot = await get(employerRef);
  //     const employerData = employerSnapshot.val();
  
  //     if (!employerData) {
  //       alert("Employer data not found.");
  //       return;
  //     }
  
  //     // Update the job entry with freelancer data and acceptance details
  //     await update(jobRef, {
  //       freelancerId: userId,
  //       freelancerName: `${freelancerData.firstname} ${freelancerData.lastname}`,
  //       acceptanceTimestamp: Date.now(),
  //       status: "accepted"
  //     });
  
  //     // Update the freelancer's `linkedEmployers` with the employer's name and business name
  //     const linkedEmployersRef = ref(db, `users/${userId}/linkedEmployers`);
  //     const currentEmployersData = (await get(linkedEmployersRef)).val();
  
  //     const updatedEmployers = currentEmployersData
  //       ? { ...currentEmployersData, [employerId]: { name: employerData.businessName } }
  //       : { [employerId]: { name: employerData.businessName } };
  
  //     await update(linkedEmployersRef, updatedEmployers);
  
  //     alert("Job accepted successfully!");
  //     setAcceptedJob(jobId);
  //   } catch (error) {
  //     console.error("Error accepting job:", error.message);
  //     alert("Error accepting job. Please try again.");
  //   }
  // };
  
  

  return (
    <div>
      <h1>Available Jobs</h1>
      <div className="job-list">
        {jobs.length > 0 ? (
          jobs.map(([id, job]) => {
            const userId = auth.currentUser?.uid;
            const hasRequested = job.requests && job.requests[userId] && job.requests[userId].status === "requested";
            const isAccepted = job.status === "accepted";

            return (
              <div className="job-item" key={id}>
                <h2>{job.title}</h2>
                <p>{job.description}</p>
                <p>Hourly Rate: ${job.payment}</p>
                <p>Starts: {job.startDate} and Ends: {job.endDate}</p>

                <p>Status: {isAccepted ? "Accepted" : hasRequested ? "Requested" : "Open"}</p>

                {/* Always show the "View Employer Profile" button */}
                <button onClick={() => handleViewProfile(job.employerId)}>
                  View Employer Profile
                </button>

                {/* Only show "Request Job" if job is open and hasn't been requested yet */}
                {!isAccepted && !hasRequested && (
                  <button onClick={() => handleRequestJob(id)}>
                    Request Job
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <p>No jobs available at the moment.</p>
        )}
      </div>
    </div>
  );
};

export default FreelancerJobBoard;