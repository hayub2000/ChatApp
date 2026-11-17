import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";



export default function Login(){
    const {login} = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const handleSubmit = async (e) =>{
        e.preventDefault();
        setError("")
        setBusy(true);

        try {
            await login(email,password)
            navigate("/")
        } catch (err) {
            setError(err.response?.data?.message || "Server se connect nahi ho paya");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="auth-wrap">
        <form className="auth-card" onSubmit={handleSubmit}>
            <h2>Login</h2>
            {error && <div className="error">{error}</div>}
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button disabled={busy}>{busy ? "Please wait..." : "Login"}</button>
            <p>Account nahi hai? <Link to="/register">Register karo</Link></p>
        </form>
        </div>
    );
}




