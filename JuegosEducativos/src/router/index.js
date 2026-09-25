import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'

import WordSearchView from '../views/games/WordSearchView.vue'
import CrosswordView from '../views/games/CrosswordView.vue'
import RouletteView from '../views/games/RouletteView.vue'
import MemoryView from '../views/games/MemoryView.vue'
import QuizView from '../views/games/QuizView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView
    },

    {
      path: '/home',
      name: 'home',
      component: HomeView
    },

    {
      path: '/juegos/sopa',
      name: 'sopa',
      component: WordSearchView
    },

    {
      path: '/juegos/crucigrama',
      name: 'crucigrama',
      component: CrosswordView
    },

    {
      path: '/juegos/ruleta',
      name: 'ruleta',
      component: RouletteView
    },

    {
      path: '/juegos/memorama',
      name: 'memorama',
      component: MemoryView
    },

    {
      path: '/juegos/preguntas',
      name: 'preguntas',
      component: QuizView
    }
  ]
})

export default router