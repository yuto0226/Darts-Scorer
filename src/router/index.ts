import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GameView from '../views/GameView.vue'
import HistoryView from '../views/HistoryView.vue'
import GameDetailsView from '../views/GameDetailsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/game/:type',
      name: 'game',
      component: GameView,
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView,
    },
    {
      path: '/history/:id',
      name: 'game-details',
      component: GameDetailsView,
    },
  ],
})

export default router
