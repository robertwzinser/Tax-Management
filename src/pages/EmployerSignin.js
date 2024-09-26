import { useState } from "react";
import {auth} from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { Link } from "react-router-dom";

function EmployerSignin(){
const [user, setUser] = useState(null)
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')

const login= ()=>{
signInWithEmailAndPassword (auth, email, password)
.then ((userdetails)=>{
setUser (userdetails.user)

})
}
const logout =()=>{
signOut (auth)
.then (()=>{
setUser(null)

})

}
return (
  <div>
    
    <h1>EmployerSignin</h1>
    <form>
      <input type="email" placeholder= "Enter Your Email" value ={email} onChange={(e)=> setEmail(e.target.value)}></input>
      <input type="password"placeholder="Enter Your Password"value={password} onChange={(e)=> setPassword(e.target.value)}></input>
      <button onClick={login}>Login</button>
    </form>
    <p><Link to={"/employersignup"}>Register Here</Link></p>
  </div>
)
}
export default EmployerSignin
