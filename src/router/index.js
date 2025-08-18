import { createRouter, createWebHistory } from "vue-router";
import Workspace from "@/views/Workspace.vue";
import History from "@/views/History.vue";

const routes = [
  {
    path: "/",
    redirect: "/workspace",
  },
  {
    path: "/workspace",
    name: "Workspace",
    component: Workspace,
    props: (route) => ({
      pid: route.query.pid,
      id: route.query.id,
      dir: route.query.dir,
      suffix: route.query.suffix,
      name: route.query.name,
      code: route.query.code,
      pname: route.query.pname,
      apiText: route.query.apiText,
    }),
  },
  {
    path: "/history",
    name: "History",
    component: History,
    props: (route) => ({
      pid: route.query.pid,
      id: route.query.id,
      dir: route.query.dir,
      suffix: route.query.suffix,
      name: route.query.name,
      code: route.query.code,
      pname: route.query.pname,
      apiText: route.query.apiText,
    }),
  },
];

const router = createRouter({
  history: createWebHistory(
    (window.location.pathname.startsWith("/access-view")
      ? "/access-view"
      : "") + "/dc-post"
  ),
  routes,
});

// 路由守卫 - 保存未完成请求
router.beforeEach((to, from, next) => {
  // 这里可以添加保存当前请求状态的逻辑
  next();
});

export default router;
