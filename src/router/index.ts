import { createRouter, createWebHistory } from 'vue-router'

import Home from '../views/Home.vue'

/* ADVERTISEMENT PAGES */

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
