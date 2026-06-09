import "./assets/main.css";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:8080";
axios.defaults.withCredentials = false;

import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
