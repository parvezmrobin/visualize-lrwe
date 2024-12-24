import axios from "axios";
import { createApp } from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";

axios.defaults.baseURL = `https://backend.lrwe.parvezmrobin.dev`;

createApp(App).use(store).use(router).mount("#app");
