import React, { useState, useEffect } from "react";
import { ref, push, update, get, onValue, query, orderByChild, equalTo } from "firebase/database"; // Firebase DB functions
import { auth, db } from "../../firebase";
import "./JobBoard.css";
import { useNavigate } from "react-router-dom";
import { equal } from "assert";

const EmployerJobBoard = ({ jobs, setJobs }) => {
  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    payment: "",
    startDate: "",
    endDate: "",
  });
  const [currentJobId, setCurrentJobId] = useState(null);
  const [jobRequests, setJobRequests] = useState([]); // Store requested jobs
  const navigate = useNavigate();
  useEffect(() => {
    // Fetch jobs with "requested" status for review
    const jobRequestsRef = ref(db, "jobs/");
    onValue(jobRequestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const requests = Object.entries(data).filter(
          ([id, job]) =>
            job.status === "requested" &&
            job.employerId === auth.currentUser?.uid
        );
        setJobRequests(requests);
      }
    });
  }, []);

  const handleAcceptRequest = async (jobId, freelancerId) => {
    const jobRef = ref(db, `jobs/${jobId}`);
    const employerId = auth.currentUser?.uid;

    try {
      // Update job status to accepted
      await update(jobRef, { status: "accepted" });

      // Update the specific request status to accepted under job requests
      const requestRef = ref(db, `jobs/${jobId}/requests/${freelancerId}`);
      await update(requestRef, { status: "accepted" });

      // Fetch employer data for adding to freelancer's linkedEmployers
      const employerDataSnapshot = await get(ref(db, `users/${employerId}`));
      const employerData = employerDataSnapshot.val();
      const employerName =
        employerData.businessName ||
        `${employerData.firstname || ""} ${
          employerData.lastname || ""
        }`.trim() ||
        employerData.name ||
        "Unknown Employer";

      // Update freelancer's linked employers list with the current employer's info
      const freelancerRef = ref(
        db,
        `users/${freelancerId}/linkedEmployers/${employerId}`
      );
      await update(freelancerRef, { name: employerName, status: "accepted" });

      // Fetch freelancer data for adding to employer's acceptedFreelancers
      const freelancerDataSnapshot = await get(
        ref(db, `users/${freelancerId}`)
      );
      const freelancerData = freelancerDataSnapshot.val();
      const freelancerName =
        `${freelancerData.firstname || ""} ${
          freelancerData.lastname || ""
        }`.trim() ||
        freelancerData.name ||
        "Unknown Freelancer";

      // Update employer's accepted freelancers list with the freelancer's info
      const employerAcceptedFreelancersRef = ref(
        db,
        `users/${employerId}/acceptedFreelancers/${freelancerId}`
      );
      await update(employerAcceptedFreelancersRef, {
        name: freelancerName,
        status: "accepted",
      });

      alert("Job request accepted and relationship created.");
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("Could not accept request. Please try again.");
    }
  };

  const handleDeclineRequest = async (jobId, freelancerId) => {
    const requestRef = ref(db, `jobs/${jobId}/requests/${freelancerId}`);
    try {
      await update(requestRef, { status: "rejected" });
      alert("Job request declined.");
    } catch (error) {
      console.error("Error declining job request:", error.message);
      alert("Error declining job request. Please try again.");
    }
  };

  const handleJobPost = async (e) => {
    e.preventDefault();

    // Get the current user ID
    const userId = auth.currentUser?.uid;
    if (!userId) {
      alert("Only employers can post jobs.");
      return;
    }

    // Define references for jobs and user data
    const jobRef = ref(db, "jobs/");
    const userRef = ref(db, `users/${userId}`);

    try {
      // Fetch employer data from Firebase
      const snapshot = await get(userRef);
      const employerData = snapshot.val();

      // Prepare the job entry with additional employer data
      const newJobEntry = {
        ...newJob,
        employerId: userId,
        employerName: `${employerData.firstname} ${employerData.lastname}`,
        employerBusinessName: employerData.businessName,
        startDate: newJob.startDate,
        endDate: newJob.endDate,
        freelancerId: null,
        status: "open",
      };

      // Push the new job entry to Firebase
      await push(jobRef, newJobEntry);
      alert("Job posted successfully!");
      
      // Define paths based on user role
      const usersref = ref (db, "users")
      const userfilter = query (usersref, orderByChild("role"), equalTo ("Freelancer"))
      onValue(userfilter, (snapshot) => {
        snapshot.forEach((child) =>{
        console.log(child.key)         
      const notificationRef = ref(db, `notifications/${child.key}`);
      const notification = {
        message: `New Job Posted: ${newJob.title}`, // Inserts the job title dynamically
        timestamp: Date.now(),
        type: "job",
      };
      try {     
        // Push the notification to the recipient's notifications
       push(notificationRef, notification);
      } catch (error) {
        console.error("Error sending message:", error.message);
      }
        })
        
      })
    
        
      // Reset the job form
      setNewJob({
        title: "",
        description: "",
        payment: "",
        startDate: "",
        endDate: "",
      });
    } catch (error) {
      console.error("Error posting job:", error.message);
      alert("Error posting job. Please try again.");
    }
  };
  const handleEditClick = (jobId) => {
    setCurrentJobId((prevJobId) => (prevJobId === jobId ? null : jobId));
  };

  const handleEditJob = async (jobId) => {
    const jobRef = ref(db, `jobs/${jobId}`);
    const updates = Object.keys(newJob).reduce((change, key) => {
      if (newJob[key] !== "") {
        change[key] = newJob[key];
      }
      return change;
    }, {});
    try {
      await update(jobRef, updates);
      alert("Job updated successfully!");
      setCurrentJobId(null); // Close the edit view after saving
    } catch (error) {
      console.error("Error updating job:", error.message);
      alert("Error updating job. Please try again.");
    }
  };

  const handleViewProfile = (freelancerId) => {
    navigate(`/profile/${freelancerId}`); // Navigates to the profile page using the UID
  };

  return (
    <div>
      <h1>Manage Your Jobs</h1>
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
          onChange={(e) =>
            setNewJob({ ...newJob, description: e.target.value })
          }
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
          placeholder="Start Date"
          value={newJob.startDate}
          onChange={(e) => setNewJob({ ...newJob, startDate: e.target.value })}
          required
        />
        <input
          type="date"
          placeholder="End Date"
          value={newJob.endDate}
          onChange={(e) => setNewJob({ ...newJob, endDate: e.target.value })}
          required
        />
        <button type="submit" className="submit-btn">
          Post Job
        </button>
      </form>

      <div className="job-list">
        {jobs.length > 0 ? (
          jobs
            .filter(
              ([id, job]) =>
                // new Date(job.endDate) >= new Date() &&
                job.employerId === auth.currentUser?.uid
            )
            .map(([id, job]) => (
              <div key={id} className="job-item">
                <h2>{job.title}</h2>
                <p>{job.description}</p>
                <p>Hourly Rate: ${job.payment}</p>
                <p>
                  Starts: {job.startDate} and Ends: {job.endDate}
                </p>
                <p className={`job-status ${job.status}`}>
                  Status:{" "}
                  {job.status === "open" ? "Open for Requests" : "Accepted"}
                </p>

                
              {/* Edit Job Section */}
              {job.employerId === auth.currentUser?.uid && (
                <>
                  <button onClick={() => handleEditClick(id)}>Edit Job</button>
                  {currentJobId === id && (
                    <div>
                      <input
                        type="text"
                        placeholder="Edit Job Title"
                        value={newJob.title}
                        onChange={(e) =>
                          setNewJob({ ...newJob, title: e.target.value })
                        }
                      />
                      <textarea
                        placeholder="Edit Job Description"
                        value={newJob.description}
                        onChange={(e) =>
                          setNewJob({ ...newJob, description: e.target.value })
                        }
                      />
                      <input
                        type="number"
                        placeholder="Edit Hourly Rate ($)"
                        value={newJob.payment}
                        onChange={(e) => setNewJob({ ...newJob, payment: e.target.value })}
                        required
                      />
                      <input
                        type="date"
                        placeholder="Edit Start Date"
                        value={newJob.startDate}
                        onChange={(e) => setNewJob({ ...newJob, startDate: e.target.value })}
                        required
                      />
                      <input
                        type="date"
                        placeholder="Edit End Date"
                        value={newJob.endDate}
                        onChange={(e) => setNewJob({ ...newJob, endDate: e.target.value })}
                        required
                      />
                      <button onClick={() => handleEditJob(id)}>
                        Save Changes
                      </button>
                    </div>
                  )}
                </>
              )}

                {/* Job Requests Section */}
                {job.requests && (
                  <div className="job-requests">
                    <h3>Job Requests</h3>
                    {Object.entries(job.requests).map(
                      ([freelancerId, request]) => (
                        <div key={freelancerId} className="request-item">
                          <p>Requested by: {request.freelancerName}</p>
                          <p>Request Status: {request.status}</p>
                          <button
                            onClick={() => handleViewProfile(freelancerId)}
                          >
                            View Profile
                          </button>
                          {request.status === "requested" &&
                            job.status === "open" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleAcceptRequest(id, freelancerId)
                                  }
                                  className="accept-request-btn"
                                >
                                  Accept Request
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeclineRequest(id, freelancerId)
                                  }
                                  className="decline-request-btn"
                                >
                                  Decline Request
                                </button>
                              </>
                            )}
                        </div>
                      )
                    )}
                  </div>
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

export default EmployerJobBoard;
