import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import NotFound from '../views/NotFound.vue'
import BlogHome from '../views/blog/Home.vue'
import helloWorldBlog from '../views/blog/hello-world.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: 'Home',
      description: "Welcome to Winte's Portal.",
    },
  },

  /* blog */
  {
    path: '/blog',
    name: 'BlogHome',
    component: BlogHome,
    meta: {
      title: 'Blog',
      description: "Read posts and updates from Winte's Portal.",
    },
  },
  {
    path: '/blog/hello-world',
    name: 'helloWorldBlog',
    component: helloWorldBlog,
    meta: {
      title: 'Hello World - BuddyWinte\'s Blog',
      description: 'The first blog post.',
    },
  },

  /* 404 */
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: '404',
      description: 'The page you requested could not be found.',
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
