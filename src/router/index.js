import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import RegisterView from '../views/RegisterView.vue'

import WordSearchView from '../views/games/WordSearchView.vue'
import CrosswordView from '../views/games/CrosswordView.vue'
import RouletteView from '../views/games/RouletteView.vue'
import MemoryView from '../views/games/MemoryView.vue'
import QuizView from '../views/games/QuizView.vue'
import DetectiveView from '../views/games/DetectiveView.vue'
import EditarJuegoView from '../views/EditarJuegoView.vue'
import CrearJuegoView from '../views/CrearJuegoView.vue'
import ProfileView from '../views/ProfileView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [

    {
    path: '/juegos/editar/:id',
    name: 'editar-juego',
    component: EditarJuegoView
    },

    {
      path: '/registro',
      name: 'registro',
      component: RegisterView
    },

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
      path: '/perfil',
      name: 'perfil',
      component: ProfileView
    },

    {
    path: '/juegos/crear',
    name: 'crear-juego',
    component: CrearJuegoView
    },

   {
    path: '/juegos/sopa/:id',
    name: 'sopa',
    component: WordSearchView
    },

    {
      path: '/juegos/crucigrama/:id',
      name: 'crucigrama-personalizado',
      component: CrosswordView
    },
    {
      path: '/juegos/crucigrama',
      name: 'crucigrama',
      component: CrosswordView
    },

    {
      path: '/juegos/ruleta/:id',
      name: 'ruleta',
      component: RouletteView
    },

    {
      path: '/juegos/memorama/:id?',
      name: 'memorama',
      component: MemoryView
    },

    {
      path: '/juegos/preguntas/:id?',
      name: 'preguntas',
      component: QuizView
    },
{
  path: '/juegos/detective/:id',
  name: 'detective',
  component: DetectiveView
}
  ]
})

export default router
