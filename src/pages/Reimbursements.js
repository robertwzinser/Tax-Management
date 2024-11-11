import { useState, useEffect } from "react";
import {
  ref as dbRef,
  push,
  set,
  query,
  orderByChild,
  equalTo,
  onValue,
  get,
} from "firebase/database";
import { auth, db, storage } from "../firebase";
import {
  uploadBytesResumable,
  getDownloadURL,
  ref as uploadRef,
} from "firebase/storage";
import "./Reimbursements.css"; // Import the same CSS file to maintain consistency

const Reimbursements = () => {
  const [inputs, setInputs] = useState([
    { category: "", expense: 0, employer: "", date: "", file: null },
  ]);
  const [employers, setEmployers] = useState([]);
  const [upload, setUpload] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(0); // New state for tracking total expenses

  const fetchEmployers = async () => {
    const employerRef = dbRef(db, "users");
    const employersquery = query(
      employerRef,
      orderByChild("role"),
      equalTo("Employer")
    );
    try {
      const snapshot = await get(employerRef);
      console.log(snapshot);
      if (snapshot.exists()) {
        console.log(snapshot.val());
        return snapshot.val();
      }
    } catch (error) {}
  };

  const addInput = () => {
    setInputs([
      ...inputs,
      { category: "", expense: 0, employer: "", date: "", file: null },
    ]);
  };

  const removeInput = (currentIndex) => {
    const filteredInputs = inputs.filter(
      (input, index) => index !== currentIndex
    );
    setInputs(filteredInputs);
  };

  const handleChange = (e, index) => {
    const inputData = [...inputs];
    if (e.target.type === "file") {
      inputData[index][e.target.name] = e.target.files[0];
    } else {
      inputData[index][e.target.name] = e.target.value;
    }

    setInputs(inputData);
  };

  useEffect(() => {
    const total = inputs.reduce(
      (acc, input) => acc + parseFloat(input.expense || 0),
      0
    );
    setTotalExpenses(total);
  }, [inputs]);

  // Calculate total expenses whenever inputs change
  useEffect(() => {
    const total = inputs.reduce(
      (acc, input) => acc + parseFloat(input.expense || 0),
      0
    );
    //setTotalExpenses(total);
    const fetchEmployerlist = async () => {
      const users = await fetchEmployers();
      const usersArray = Object.entries(users).map(([key, value]) => ({
        id: key,
        ...value,
      }));
      const elist = usersArray.filter((user) => user.role === "Employer");
      setEmployers(elist);
      console.log(elist);
    };
    fetchEmployerlist();
  }, [inputs]);

  const formSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user.uid) {
      let fullname = "";
      let email = "";
      let URL = "";
      const userRef = dbRef(db, "users/" + user.uid);
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
          fullname = userData.firstname + " " + userData.lastname;
          email = userData.email;
        }
      });

      inputs.map(async (input) => {
        try {
          console.log(input.file);
          const file = input.file;
          if (!file) console.log("null file");
          const storageRef = uploadRef(storage, `images/${file.name}`);
          const uploadTask = uploadBytesResumable(storageRef, file);
          console.log(input);
          setUpload(true);
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              console.log("uploading");
            },
            (error) => {
              console.log(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

              const expenseRef = dbRef(db, "reimbursementCollection");
              const newExpense = push(expenseRef);
              await set(newExpense, {
                category: input.category,
                expense: input.expense,
                date: input.date,
                downloadURL,
                userID: user.uid,
                fullname,
                email,
                employer: input.employer,
                accepted: null,
              });
              setInputs([
                {
                  category: "",
                  expense: 0,
                  employer: "",
                  date: "",
                  file: null,
                },
              ]);
              setUpload(false);
            }
          );
        } catch (error) {
          console.log(error);
        }
      });
    }
  };

  return (
    <div className="expenses-container">
      <h1>Request a Reimbursement</h1>
      <div className="expenses-content">
        <form className="expense-form" onSubmit={(e) => formSubmit(e)}>
          {inputs.map((input, index) => (
            <div key={index} className="expense-item">
              <label htmlFor="category">Category:</label>
              <select
                value={input.category}
                name="category"
                onChange={(e) => handleChange(e, index)}
              >
                <option value="">-- Select Category --</option>
                <option value="Travel">Travel</option>
                <option value="Lodging">Lodging</option>
                <option value="Food">Food</option>
                <option value="PPE">PPE</option>
                <option value="Tools">Tools</option>
                <option value="Advertising">Advertising</option>
                <option value="Utilities">Utilities</option>
                <option value="Miscellaneous">Miscellaneous</option>
                <option value="Subscription">Subscription</option>
                <option value="Data/Security Software">
                  Data/Security Software
                </option>
              </select>

              <label htmlFor="expense">Cost:</label>
              <input
                type="number"
                name="expense"
                placeholder="Choose your expense"
                value={input.expense}
                onChange={(e) => handleChange(e, index)}
              />

              <label htmlFor="date">Date:</label>
              <input
                type="date"
                value={input.date}
                name="date"
                onChange={(e) => handleChange(e, index)}
              />

              {/* Employer Selection Dropdown */}
              <label htmlFor="employer">Employer:</label>
              <select
                name="employer"
                value={input.employer}
                onChange={(e) => handleChange(e, index)}
              >
                <option value="">-- Select Employer --</option>
                {employers.map((employer) => (
                  <option key={employer.id} value={employer.id}>
                    {employer.businessName}
                  </option>
                ))}
              </select>

              <label htmlFor="employer">Receipt Upload:</label>
              <input
                type="file"
                name="file"
                onChange={(e) => handleChange(e, index)}
              ></input>

              {inputs.length > 1 && (
                <button type="button" onClick={() => removeInput(index)}>
                  Remove Expense
                </button>
              )}
            </div>
          ))}

          <button type="button" onClick={addInput}>
            Add New Reimbursements
          </button>
          <button type="submit" disabled={upload}>
            Submit
          </button>
        </form>

        {/* Display total expenses on the side */}
        <div className="total-expenses">
          <h1>Total Reimbursements: ${totalExpenses.toFixed(2)}</h1>
        </div>
      </div>
    </div>
  );
};

export default Reimbursements;
