import { useState, useEffect } from "react";
import {
  getDatabase,
  ref,
  push,
  set,
  serverTimestamp,
  onValue,
  update,
} from "firebase/database";
import { auth } from "../firebase";
import "./Deductions.css";

const Deductions = () => {
  const [deduction, setDeduction] = useState({
    category: "",
    amount: "",
    date: "", // New field to store the date of the deduction
  });
  const [userDeductions, setUserDeductions] = useState([]); // Store submitted deductions
  const [editingIndex, setEditingIndex] = useState(null); // Track which deduction is being edited
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [taxBurdenReduction, setTaxBurdenReduction] = useState(0);

  useEffect(() => {
    const fetchDeductions = async () => {
      const user = auth.currentUser;
      if (user?.uid) {
        const db = getDatabase();
        const userDeductionRef = ref(db, `deductionCollection/${user.uid}`);
        onValue(userDeductionRef, (snapshot) => {
          const fetchedDeductions = snapshot.val();
          if (fetchedDeductions) {
            const deductionsArray = Object.entries(fetchedDeductions).map(
              ([id, data]) => ({
                id,
                ...data,
              })
            );
            setUserDeductions(deductionsArray);
            const total = deductionsArray.reduce(
              (acc, curr) => acc + parseFloat(curr.amount || 0),
              0
            );
            setTotalDeductions(total);
          }
        });
      }
    };

    fetchDeductions();
  }, []);

  const handleDeductionChange = (e) => {
    const { name, value } = e.target;
    setDeduction(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || '' : value,
    }));
  };

  const formSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user?.uid) return;

    const db = getDatabase();
    const deductionRef = ref(db, `deductionCollection/${user.uid}`);

    if (editingIndex !== null) {
      // Update existing deduction
      const dedId = userDeductions[editingIndex].id;
      await update(ref(db, `${deductionRef}/${dedId}`), {
        ...deduction,
        totalDeductions: deduction.amount,
        timestamp: serverTimestamp(),
      });
      setEditingIndex(null); // Reset editing index
    } else {
      // Create new deduction
      await push(deductionRef, {
        ...deduction,
        totalDeductions: deduction.amount,
        timestamp: serverTimestamp(),
      });
    }

    setDeduction({ category: "", amount: "", date: "" }); // Reset form fields
  };

  const editDeduction = (index) => {
    setDeduction(userDeductions[index]);
    setEditingIndex(index);
  };

  return (
    <div className="deductions-container">
      <h1>Deductions Management</h1>
      <form className="deduction-form" onSubmit={formSubmit}>
        <div className="deduction-input">
          <label>Deduction Date:</label>
          <input
            type="date"
            name="date"
            value={deduction.date}
            onChange={handleDeductionChange}
            required
          />
        </div>

        <div className="deduction-input">
          <label>Deduction Category:</label>
          <input
            type="text"
            name="category"
            value={deduction.category}
            onChange={handleDeductionChange}
            placeholder="Enter deduction category"
            required
          />
          <label>Deduction Amount:</label>
          <input
            type="number"
            name="amount"
            value={deduction.amount}
            onChange={handleDeductionChange}
            placeholder="Input the corresponding amount"
            required
          />
        </div>

        <button type="submit" className="submit-button">
          {editingIndex !== null ? "Update Deduction" : "Submit Deduction"}
        </button>
      </form>

      <div className="deduction-summary">
        <h2>Total Deductions: ${totalDeductions.toFixed(2)}</h2>
      </div>

      <div className="submitted-deductions">
        <h2>Submitted Deductions:</h2>
        {userDeductions.length > 0 ? (
          <ul>
            {userDeductions.map((ded, index) => (
              <li key={ded.id}>
                <div>
                  <strong>Category:</strong> {ded.category} |{" "}
                  <strong>Amount:</strong> ${ded.amount} |{" "}
                  <strong>Date:</strong> {ded.date}
                </div>
                <button onClick={() => editDeduction(index)}>Edit</button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No deductions submitted yet.</p>
        )}
      </div>
    </div>
  );
};

export default Deductions;
