import "./assets/main.css";
import axios from "axios";

axios.defaults.withCredentials = false;
axios.defaults.baseURL = "http://13.124.245.69:8080";
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
