import axios from "axios";

const api = axios.create({
  baseURL: "https://anonymous-mental-health-forum.onrender.com",
  withCredentials: true,
});

export default api;