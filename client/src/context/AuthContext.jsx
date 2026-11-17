import { createContext,useContext,useState,useEffect } from "react";
import api from "../api/axios"

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext);

export function AuthProvider ({ children }) {
    const [user, setUser] = useState(null);
    const [loading,setLoading] = useState(true);

    useEffect(()=>{

        const token = localStorage.getItem("token")
        if(!token)
        {
            setLoading(false);
            return
        }

        api.get("/auth/me").then((res)=> setUser(res.data.user)).catch(()=> localStorage.removeItem("token")).finally(()=> setLoading(false))

    },[])

    const saveSession = (data) =>{
        localStorage.setItem("token", data.token)
        setUser(res.data)
    }

    const login = async (email,password) =>{
        const res = await api.post("/auth/login",{email,password})
        saveSession(res.data)
    }

    const register = async (username,email,password) =>{
        const res = await api.post("/auth/register", {username,email,password})
        saveSession(res.data)

    }

    const logout = () =>{
        localStorage.removeItem("token")
        setUser(null)
    }



return (
    <AuthContext.Provider value={{user,loading,login,logout,register}}>
        {children}
    </AuthContext.Provider>
)
}

