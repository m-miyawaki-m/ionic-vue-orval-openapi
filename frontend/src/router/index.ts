import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'
import { useAuthStore } from '@/stores/auth'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/tab1'
  },
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue')
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/tab1'
      },
      {
        path: 'tab1',
        component: () => import('@/views/TabItemsPage.vue')
      },
      {
        path: 'tab2',
        component: () => import('@/views/TabSearchPage.vue')
      },
      {
        path: 'tab3',
        component: () => import('@/views/TabSettingsPage.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.path.startsWith('/tabs') && !auth.isAuthenticated) return '/login'
  return true
})

export default router
