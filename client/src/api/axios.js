import axios from "axios"


const api = axios.create({baseURL: "http://localhost:5000/api" })

api.interceptors.request.use((config)=>{
    const token = localStorage.getItem("token")
    if(token) config.headers.Authorization = `Bearer ${token}`
    return config;
});


// Token expire ya invalid ho to khud logout
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || "";
    const isAuthCall = url.includes("/auth/login") || url.includes("/auth/register");
    if (err.response?.status === 401 && !isAuthCall && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);


export default api;
