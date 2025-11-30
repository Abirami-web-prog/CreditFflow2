import axios from "axios";

const API = axios.create({
  baseURL: "https://creditfflow2-1.onrender.com", // backend URL
});

export const predictCreditFlow = (data) => API.post("/predict", data);
