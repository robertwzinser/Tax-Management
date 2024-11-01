import React, { useState, useEffect } from "react";
import { ref, onValue, remove, set } from "firebase/database";
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
  const jobsRef = ref (db, "businesses")
  onValue(jobsRef, (snapshot) => {
    const data = snapshot.val ()
    let activejobs = []
    console.log (data)
    if (data){
      Object.entries(data).forEach(([key, value]) => {
        console.log(value)
        console.log(key)
        const jobs = value.jobs?.active || null
        if (jobs){
          activejobs = [... activejobs, Object.entries(jobs).flatMap(([id, details])=>({id, ... details}))]
          const currenttime = new Date().getTime()
          Object.entries(jobs).forEach(([jobID, jobdetails])=>{
            const deadlineDate = new Date (jobdetails.deadline)
            console.log(deadlineDate)
            deadlineDate.setUTCHours(23,59,59,999)
            const deadline = deadlineDate.getTime()
            console.log(deadline)
            console.log(currenttime)
            if (deadline < currenttime){
              const activejobref = ref(db, `businesses/${key}/jobs/active/${jobID}`)
              const inactivejobref = ref(db, `businesses/${key}/jobs/inactive/${jobID}`)
              set(inactivejobref, {...jobdetails, status: "closed"}).then(()=> remove(activejobref))
            }
          })
        }
         
      })
      console.log(activejobs)
      setJobs (activejobs.flat())
    }
  })
    // const jobsRef = ref(db, "jobs/");
    // onValue(jobsRef, (snapshot) => {
    //   const data = snapshot.val();
    //   if (data) {
    //     setJobs(Object.entries(data));
    //   }
    // });
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
