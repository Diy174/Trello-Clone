import axios from "axios";

const axiosInstance = axios.create({
  baseURL: VITE_API_BASE_URL,
});

export default axiosInstance;