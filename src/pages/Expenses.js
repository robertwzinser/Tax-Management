import { useState } from "react";
import { getDatabase, ref, push, set, serverTimestamp } from "firebase/database";
import { auth, db } from "../firebase";
import "./Expenses.css"; // Import the same CSS file to maintain consistency

const Expenses = () => {
  const [category, setCategory] = useState("");
  const [inputs, setInputs] = useState([{ category: "", expense: 0 }]);

  const addInput = () => {
    setInputs([...inputs, { category: "", expense: 0 }]);
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

  const formSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user.uid) {
      inputs.map(async (input) => {
        try {
          const expenseRef = ref(db, "expenseCollection");
          const newExpense = push(expenseRef);
          await set(newExpense, {
            category: input.category,
            expense: input.expense,
            date: serverTimestamp(),
            userID: user.uid,
          });
          setInputs([{ category: "", expense: 0 }]);
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
                placeholder="Choose your expense"
                value={input.expense}
                name="expense"
                onChange={(e) => handleChange(e, index)}
              />

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
      </div>
    </div>
  );
};

export default Expenses;