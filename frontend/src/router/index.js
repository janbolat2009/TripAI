import { createRouter, createWebHistory } from 'vue-router';
import TourDetails from '../components/TourDetails.vue';
import Favorite from '../components/Favorite.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../App.vue'), // Ленивая загрузка
  },
  {
  path: '/tour',
  name: 'TourDetails',
  component: TourDetails,
  props: (route) => {
    let tour = {};
    try {
      tour = route.query.tour ? JSON.parse(route.query.tour) : {};
    } catch (e) {
      console.warn('[Router] Ошибка парсинга tour из query:', e.message, route.query.tour);
      tour = {};
    }
    return {
      userCity: route.query.userCity || 'Астана',
      needsFlight: tour.needsFlight || false, // Берем из tour, дефолт — false
      tour,
    };
  },
},
  {
    path: '/favorites',
    name: 'Favorites',
    component: Favorite,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;