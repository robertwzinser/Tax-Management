import React, { useState } from "react";
import { ref, push, update } from "firebase/database"; // Firebase DB functions
import { auth, db } from "../../firebase";
import "./JobBoard.css";

const EmployerJobBoard = ({ jobs, setJobs }) => {
  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    payment: "",
    deadline: "",
  });
  const [currentJobId, setCurrentJobId] = useState(null);

  const handleJobPost = async (e) => {
    e.preventDefault();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      alert("Only employers can post jobs.");
      return;
    }

    const jobRef = ref(db, "jobs/");
    const newJobEntry = {
      ...newJob,
      employerId: userId,
      freelancerId: null,
      status: "open",
    };

    try {
      await push(jobRef, newJobEntry);
      alert("Job posted successfully!");
      setNewJob({ title: "", description: "", payment: "", deadline: "" });
    } catch (error) {
      console.error("Error posting job:", error.message);
      alert("Error posting job. Please try again.");
    }
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
      setCurrentJobId(null);
    } catch (error) {
      console.error("Error updating job:", error.message);
      alert("Error updating job. Please try again.");
    }
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
          placeholder="Deadline"
          value={newJob.deadline}
          onChange={(e) => setNewJob({ ...newJob, deadline: e.target.value })}
          required
        />
        <button type="submit" className="submit-btn">
          Post Job
        </button>
      </form>

      <div className="job-list">
        {jobs.length > 0 ? (
          jobs.map(([id, job]) => (
            <div key={id} className="job-item">
              <h2>{job.title}</h2>
              <p>{job.description}</p>
              <p>Hourly Rate: ${job.payment}</p>
              <p>Deadline: {job.deadline}</p>
              <p className={`job-status ${job.status}`}>
                {job.status === "open" ? "Open" : "Accepted"}
              </p>
              {job.employerId === auth.currentUser?.uid && (
                <>
                  <button onClick={() => setCurrentJobId(id)}>Edit Job</button>
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
                      <button onClick={() => handleEditJob(id)}>
                        Save Changes
                      </button>
                    </div>
                  )}
                  {job.freelancerId && <p>Job accepted by freelancer.</p>}
                </>
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
