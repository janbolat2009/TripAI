<template>
  <div class="favorites-container">
    <header>
      <div class="burger-div">
        <img :src="burgerMenu" alt="Menu" class="burger-menu">
        <p>Каталог</p>
      </div>
      <img :src="logotype" alt="Logotype" class="logotype" @click="$this.router.push('/')">
      <div class="right-panel">
        <img :src="searchIcon" alt="Search" class="search-icon">
        <img :src="userIcon" alt="User" class="user-icon">
        <router-link to="/favorites">
          <img :src="heartFilledIcon" alt="Favorite" class="favorite-icon">
        </router-link>
      </div>
    </header>

    <div class="favorites-content">
      <h1>Избранные туры</h1>
      <div v-if="favorites.length" class="favorites-grid">
        <div v-for="tour in favorites" :key="tour.title" class="favorite-item">
          <div class="favorite-image-placeholder"></div>
          <div class="favorite-content">
            <h3>{{ tour.title }}</h3>
            <p class="favorite-desc">{{ tour.description }}</p>
            <div class="favorite-price">{{ tour.price }}</div>
            <div class="favorite-action">
              <button class="view-tour-btn" @click.stop="goToTourDetails(tour)">Подробнее</button>
              <button class="remove-favorite-btn" @click.stop="removeFromFavorites(tour)">
                <img :src="heartFilledIcon" alt="Remove from Favorite" class="remove-favorite-icon">
              </button>
            </div>
          </div>
        </div>
      </div>
      <p v-else class="no-favorites">Нет избранных туров. Добавьте туры на главной странице!</p>
    </div>

    <footer>
      <div class="footer-content">
        <div class="footer-section">
          <img :src="logotype" alt="Logotype" class="footer-logotype">
          <p>Путешествия по Казахстану</p>
        </div>
        <div class="footer-section">
          <h3>Контакты</h3>
          <p>Email: info@tripai.kz</p>
          <p>Тел: +7 (777) 123-45-67</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';
import burgerMenu from '../img/icon menu.png';
import logotype from '../img/Logotype.png';
import searchIcon from '../img/Search 24px.png';
import userIcon from '../img/User 24px.png';
import heartFilledIcon from '../img/HeartFilled.png';

export default {
  setup() {
    const router = useRouter();
    return { router };
  },
  data() {
    return {
      favorites: [],
      burgerMenu,
      logotype,
      searchIcon,
      userIcon,
      heartFilledIcon,
    };
  },
  methods: {
    loadFavorites() {
      this.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    },
    goToTourDetails(tour) {
      console.log('[Favorite.vue] Переход к туру:', tour);
      try {
        this.router.push({
          name: 'TourDetails',
          params: { title: tour.title },
          query: { tour: JSON.stringify(tour) },
        });
      } catch (error) {
        console.error('[Favorite.vue] Ошибка при маршрутизации:', error);
      }
    },
    removeFromFavorites(tour) {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const index = favorites.findIndex(fav => fav.title === tour.title);
      if (index !== -1) {
        favorites.splice(index, 1);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        this.favorites = favorites;
        console.log('[Favorite.vue] Тур удален из избранного:', tour.title);
      }
    },
  },
  mounted() {
    this.loadFavorites();
  },
};
</script>

<style scoped>
.favorites-container {
  padding-top: 175px;
  box-sizing: border-box;
}

header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 60px;
  height: 175px;
  background: rgba(55, 95, 87, 0.9);
  backdrop-filter: blur(15px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

header:hover {
  background: rgba(55, 95, 87, 0.95);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
}

.burger-div {
  display: flex;
  align-items: center;
  gap: 15px;
  height: 22px;
}

.burger-div p {
  font-size: 1.2rem;
  font-weight: 500;
  color: #d1e8e2;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
  margin: 0;
}

.burger-menu, .search-icon, .user-icon, .favorite-icon {
  width: 30px;
  height: 30px;
  transition: transform 0.3s ease;
  cursor: pointer;
}

.burger-menu:hover, .search-icon:hover, .user-icon:hover, .favorite-icon:hover {
  transform: scale(1.1);
  filter: brightness(1.2);
}

.logotype {
  height: 70px;
  width: 70px;
  cursor: pointer;
}

.right-panel {
  display: flex;
  align-items: center;
  gap: 25px;
}

.favorites-content {
  width: 100%;
  padding: 40px 60px;
  background: rgba(30, 61, 54, 0.95);
  margin: 40px 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.favorites-content h1 {
  font-size: 2.5rem;
  color: #d1e8e2;
  margin-bottom: 40px;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
  font-weight: bold;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.favorite-item {
  background: linear-gradient(145deg, rgba(67, 181, 129, 0.15), rgba(46, 125, 50, 0.15));
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 2px solid rgba(67, 181, 129, 0.3);
}

.favorite-item:hover {
  transform: translateY(-10px) scale(1.03);
  box-shadow: 0 15px 40px rgba(67, 181, 129, 0.4);
  border-color: rgba(67, 181, 129, 0.7);
}

.favorite-image-placeholder {
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  position: relative;
}

.favorite-image-placeholder::after {
  content: '❤️';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 3.5rem;
  opacity: 0.85;
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.3));
}

.favorite-content {
  padding: 25px;
  text-align: center;
}

.favorite-content h3 {
  font-size: 1.5rem;
  color: #d1e8e2;
  margin: 0 0 15px 0;
  font-weight: bold;
}

.favorite-desc {
  font-size: 1.1rem;
  color: #b0c4b1;
  margin: 0 0 20px 0;
  line-height: 1.5;
}

.favorite-price {
  font-size: 1.4rem;
  color: #43b581;
  font-weight: bold;
  margin-bottom: 20px;
}

.favorite-action {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.view-tour-btn {
  background: linear-gradient(135deg, #43b581, #2e8b57);
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Arial', sans-serif;
  position: relative;
  z-index: 10;
}

.view-tour-btn:hover {
  background: linear-gradient(135deg, #2e8b57, #1b5e20);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(67, 181, 129, 0.4);
}

.remove-favorite-btn {
  background: transparent;
  border: none;
  padding: 12px;
  cursor: pointer;
  position: relative;
  z-index: 10;
  transition: transform 0.3s ease;
}

.remove-favorite-btn:hover {
  transform: scale(1.1);
}

.remove-favorite-icon {
  width: 24px;
  height: 24px;
}

.no-favorites {
  text-align: center;
  color: #e57373;
  font-size: 1.3rem;
  padding: 40px;
  background: rgba(58, 34, 34, 0.8);
  border-radius: 15px;
  margin: 20px 0;
}

footer {
  width: 100%;
  padding: 40px 60px;
  background: rgba(30, 61, 54, 0.95);
  border-top: 3px solid #d1e8e2;
  box-shadow: 0 -8px 25px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
}

.footer-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 60px;
  max-width: 1200px;
  margin: 0 auto;
}

.footer-section {
  text-align: center;
  flex: 1;
}

.footer-logotype {
  width: 60px;
  height: 60px;
  margin-bottom: 15px;
}

.footer-section p {
  font-size: 1.1rem;
  color: #b0c4b1;
  line-height: 1.6;
  margin: 5px 0;
}

.footer-section h3 {
  font-size: 1.5rem;
  color: #d1e8e2;
  margin-bottom: 15px;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
  font-weight: bold;
}

@media (max-width: 1024px) {
  .favorites-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .footer-content {
    flex-direction: column;
    gap: 30px;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .favorites-container {
    padding-top: 120px;
  }
  header {
    padding: 15px 20px;
    height: 120px;
  }
  .burger-div {
    gap: 10px;
  }
  .burger-div p {
    font-size: 1rem;
  }
  .burger-menu, .search-icon, .user-icon, .favorite-icon {
    width: 24px;
    height: 24px;
  }
  .logotype {
    width: 50px;
    height: 50px;
  }
  .right-panel {
    gap: 15px;
  }
  .favorites-content {
    padding: 30px 20px;
  }
  .favorites-content h1 {
    font-size: 2rem;
  }
  .favorites-grid {
    grid-template-columns: 1fr;
  }
  .favorite-item {
    margin: 0 10px;
  }
  .favorite-content {
    padding: 20px;
  }
  .footer-content {
    flex-direction: column;
    gap: 25px;
  }
}

@media (max-width: 480px) {
  header {
    padding: 10px 15px;
    height: 100px;
  }
  .favorites-container {
    padding-top: 100px;
  }
  .burger-div p {
    font-size: 0.9rem;
  }
  .burger-menu, .search-icon, .user-icon, .favorite-icon {
    width: 20px;
    height: 20px;
  }
  .logotype {
    width: 40px;
    height: 40px;
  }
  .right-panel {
    gap: 12px;
  }
  .favorites-content {
    padding: 20px 15px;
  }
  .favorites-content h1 {
    font-size: 1.8rem;
  }
  .favorite-item {
    margin: 0 5px;
  }
  .favorite-image-placeholder {
    height: 150px;
  }
  .favorite-content h3 {
    font-size: 1.3rem;
  }
  .favorite-desc {
    font-size: 1rem;
  }
  .favorite-price {
    font-size: 1.2rem;
  }
}
</style>