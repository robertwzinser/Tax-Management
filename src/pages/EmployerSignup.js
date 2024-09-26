import { useState } from "react";
import {auth} from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { Link } from "react-router-dom";

function EmployerSignup(){
const [user, setUser] = useState(null)
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')

const SignUp = () => {
createUserWithEmailAndPassword(auth, email, password)
.then((userdetails)=>{
setUser(userdetails.user)
})
}

return (
  <div>
    <h1>EmployerSignup</h1>
    <form>
      <input type="email" placeholder= "Enter Your Email" value ={email} onChange={(e)=> setEmail(e.target.value)}></input>
      <input type="password"placeholder="Enter Your Password"value={password} onChange={(e)=> setPassword(e.target.value)}></input>
      <button onClick={SignUp}>SignUp</button>
    </form>
    <p><Link to={"/employersignin"}>Already have an account?</Link></p>
  </div>
)
}
export default EmployerSignup
