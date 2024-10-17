import { getDatabase, ref, update } from "firebase/database";
import { db } from "../../firebase";
import "./EmployerWidgets.css"
export const EmployerWidgets = ({expenseData}) => {
  const expensedecision = async (id, decision)=>{
  const expenseRef = ref(db, `expenseCollection/${id}`)
  const updatedexpense = {
    accepted: decision
  }
  await update(expenseRef, updatedexpense)
  }
  console.log(expenseData)
  return (
    <div className="widget">
      <h2>Project Management</h2>
      <h2> Expenses </h2>
      {expenseData.map((expense)=>(
        <div className = "expenselist">
          <h3> Freelancer: {expense.fullname} </h3>
          {/* <label> Freelancer: {expense.userID} </label> */}
          <label>Category: {expense.category}</label>
          <label>Cost: {expense.expense} </label>
          <label>Email: {expense.email}</label>
          <label>Image: <a href = {expense.downloadURL} target= "_blank"> {expense.downloadURL}</a> </label>
          {expense.accepted === undefined && <div> 
          <button onClick={(e)=> expensedecision(expense.id, true)}> Accept Expense </button>
          <button onClick={(e)=> expensedecision(expense.id, false)}> Reject Expense </button>
            </div>}
          
           </div>
      ))}
    </div>
  );
};
