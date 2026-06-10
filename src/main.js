import "./assets/main.css";
import axios from "axios";

axios.defaults.withCredentials = false;

import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
