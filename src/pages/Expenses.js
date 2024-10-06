import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import "./Expenses.css";

const Expenses = () => {
  const [inputs, setInputs] = useState([{ category: "", expense: "0" }]);
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

  const addInput = () => {
    setInputs([...inputs, { category: "", expense: "0" }]);
  };

  const removeInput = (currentIndex) => {
    const filteredInputs = inputs.filter(
      (input, index) => index !== currentIndex
    );
    setInputs(filteredInputs);
  };

  const handleChange = (e, index) => {
    const inputData = [...inputs];
    inputData[index][e.target.name] = e.target.value;
    setInputs(inputData);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="expenses-container">
      <h1>Expenses</h1>
      <div className="expenses-content">
        <form className="expense-form">
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

              <label htmlFor="expense">Expense:</label>
              <input
                type="number"
                placeholder="Enter expense"
                name="expense"
                value={input.expense}
                onChange={(e) => handleChange(e, index)}
              />

              {inputs.length > 1 && (
                <button type="button" onClick={() => removeInput(index)}>
                  Remove Expense
                </button>
              )}
            </div>
          ))}

          <button type="button" onClick={addInput}>
            Add New Expense
          </button>
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default Expenses;
