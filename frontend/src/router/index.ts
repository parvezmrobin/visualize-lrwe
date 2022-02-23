import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Home from "../views/Home.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/bug-localization",
    name: "BugLocalization",
    component: () =>
      import(
        /* webpackChunkName: "bug-localization" */
        "../views/BugLocalization.vue"
      ),
  },
  {
    path: "/custom-drawing",
    name: "CustomDrawing",
    component: () =>
      import(
        /* webpackChunkName: "custom-drawing" */ "../views/CustomDrawing.vue"
      ),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
