import { useState, useEffect } from "react";
import { getDatabase, ref, push, set, serverTimestamp, onValue } from "firebase/database";
import { auth } from "../firebase";
import "./Expenses.css";

const Expenses = () => {
  const [inputs, setInputs] = useState([{ category: "", expense: 0, date: "", employer: "" }]);
  const [totalExpenses, setTotalExpenses] = useState(0); // New state for tracking total expenses
  const [employers, setEmployers] = useState([]); // New state to store the employers
  const [selectedEmployer, setSelectedEmployer] = useState(""); // Store selected employer

  // Fetch employers when the component mounts
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      const linkedEmployersRef = ref(getDatabase(), `users/${userId}/linkedEmployers`);
      onValue(linkedEmployersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const employersData = Object.entries(data).map(([id, employer]) => ({
            id,
            businessName: employer.name,
          }));
          setEmployers(employersData);
        }
      });
    }
  }, []);

  const addInput = () => {
    setInputs([...inputs, { category: "", expense: 0, date: "", employer: "" }]);
  };

  const removeInputs = (currentIndex) => {
    const filteredInputs = inputs.filter((input, index) => index !== currentIndex);
    setInputs(filteredInputs);
  };

  const handleChange = (e, index) => {
    const inputData = [...inputs];
    inputData[index][e.target.name] = e.target.value;
    setInputs(inputData);
  };

  // Calculate total expenses whenever inputs change
  useEffect(() => {
    const total = inputs.reduce((acc, input) => acc + parseFloat(input.expense || 0), 0);
    setTotalExpenses(total);
  }, [inputs]);

  const formSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user.uid) {
      inputs.map(async (input) => {
        try {
          const expenseRef = ref(getDatabase(), "expenseCollection");
          const newExpense = push(expenseRef);
          await set(newExpense, {
            category: input.category,
            expense: input.expense,
            date: input.date,
            employer: input.employer, // Save the selected employer with the expense
            timestamp: serverTimestamp(),
            userID: user.uid,
          });
          setInputs([{ category: "", expense: 0, date: "", employer: "" }]); // Reset inputs after submission
        } catch (error) {
          console.log(error);
        }
      });
    }
  };

  return (
    <div className="expenses-container">
      <h1>Expenses</h1>
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

              <label htmlFor="expense">Expense:</label>
              <input
                type="number"
                placeholder="Enter expense"
                value={input.expense}
                name="expense"
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

              {inputs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInputs(index)}
                  className="remove-button"
                >
                  Remove Expense
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addInput} className="add-button">
            Add New Expense
          </button>
          <button type="submit" className="submit-button">
            Submit
          </button>
        </form>

        {/* Display total expenses on the side */}
        <div className="total-expenses">
          <h2>Total Expenses: ${totalExpenses.toFixed(2)}</h2>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
