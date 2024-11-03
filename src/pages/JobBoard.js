import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import EmployerJobBoard from "../components/JobBoard/EmployerJobBoard";
import FreelancerJobBoard from "../components/JobBoard/FreelancerJobBoard";

const JobBoard = () => {
  const [jobs, setJobs] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async (userId) => {
      const userRef = ref(db, "users/" + userId);
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
          setUserRole(userData.role);
        }
        setLoading(false);
      });
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userId = user.uid;
        fetchUserRole(userId);
      } else {
        setUserRole("");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const jobsRef = ref(db, "jobs/");
    onValue(jobsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setJobs(Object.entries(data));
      }
    });
  }, []);

  if (loading) {
    return <div></div>;
  }

  return (
    <div className="job-board-container">
      {userRole === "Employer" ? (
        <EmployerJobBoard jobs={jobs} setJobs={setJobs} />
      ) : (
        <FreelancerJobBoard jobs={jobs} />
      )}
    </div>
  );
};

export default JobBoard;