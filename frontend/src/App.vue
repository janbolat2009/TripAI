<template>
  <div class="app-content">
    <!-- Header Section -->
    <header>
      <div class="burger-div" @click="toggleSidebar">
        <img :src="burgerMenu" alt="Menu" class="burger-menu" />
        <p>Каталог</p>
      </div>
      <img :src="logotype" alt="Logotype" class="logotype" @click="$router.push('/')"/>
      <div class="right-panel">
        <img :src="searchIcon" alt="Search" class="search-icon" />
        <img
          :src="userIcon"
          alt="User"
          class="user-icon"
          @click="isAuthenticated ? (showProfileModal = true) : (showRegisterModal = true)"
        />
        <router-link to="/favorites">
          <img :src="heartIcon" alt="Favorite" class="favorite-icon" />
        </router-link>
      </div>
    </header>

    <!-- Sidebar -->
    <div class="sidebar" :class="{ 'open': isSidebarOpen }">
      <button @click="toggleSidebar" class="close-btn">&times;</button>
      <h3>Меню</h3>
      <ul>
        <li><a href="#tours">Туры</a></li>
        <li><a href="#hotels">Отели</a></li>
        <li><a href="#flights">Рейсы</a></li>
      </ul>
      <div class="translator-trigger" @click="showTranslatorModal = true">
        Переводчик
      </div>
    </div>

    <!-- City Selector and Router View -->
    <CitySelector @city-selected="handleCitySelected" />
    <router-view :user-city="userCity" :needs-flight="needsFlight" />

    <!-- Welcome Section -->
    <div class="welcome-div">
      <img :src="welcomeImage" alt="Welcome Image" class="welcome-img" />
      <div class="ai-search">
        <button @click="aiToggle = true" class="ai-btn">Найти туры с ИИ</button>
      </div>
    </div>

    <!-- AI Generate Modal -->
    <AIGenerate
      v-if="aiToggle"
      @close="aiToggle = false"
      @generate="handleTours"
      :tours="tours"
      :error="error"
      :loading="loading"
    />

  <div v-if="showTranslatorModal" class="translator-modal-overlay" @click.self="showTranslatorModal = false">
  <div class="translator-modal">
    <button class="modal-close-btn" @click="showTranslatorModal = false">&times;</button>
    <h3>Переводчик</h3>
    <select v-model="sourceLang" class="lang-select">
      <option value="RU">Русский</option>
      <option value="EN">English</option>
      <option value="KK">Қазақша</option>
      <option value="DE">Deutsch</option>
      <option value="FR">Français</option>
      <option value="ES">Español</option>
      <option value="IT">Italiano</option>
      <option value="ZH">中文 (Chinese)</option>
    </select>
    <select v-model="targetLang" class="lang-select">
      <option value="EN">English</option>
      <option value="RU">Русский</option>
      <option value="KK">Қазақша</option>
      <option value="DE">Deutsch</option>
      <option value="FR">Français</option>
      <option value="ES">Español</option>
      <option value="IT">Italiano</option>
      <option value="ZH">中文 (Chinese)</option>
    </select>
    <input v-model="textToTranslate" placeholder="Введите текст" class="translate-input" />
    <button @click="translateText" class="translate-btn">Перевести</button>
    <p class="translated-text">{{ translatedText }}</p>
  </div>
  </div>

    <!-- Tours Section -->
    <div class="tours-container">
      <h2>Популярные туры</h2>
      <div class="tours-flex">
        <div v-for="tour in tours" :key="tour.id" class="tour-item">
          <img
            :src="tour.image || '/img/placeholder.jpg'"
            alt="Tour image"
            class="tour-image"
          />
          <div class="tour-content">
            <h3>{{ tour.title }}</h3>
            <p class="tour-desc">{{ tour.description }}</p>
            <div class="tour-price">{{ tour.price }}</div>
            <div class="tour-action">
              <button class="view-tour-btn" @click="goToTourDetails(tour)">Подробнее</button>
              <button class="favorite-btn" @click="toggleFavorite(tour)">
                <img
                  :src="isFavorite(tour) ? heartFilledIcon : heartIcon"
                  :alt="isFavorite(tour) ? 'Remove from Favorite' : 'Add to Favorite'"
                  class="favorite-btn-icon"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Why Us Section -->
    <div class="why-us">
      <h3>Почему мы?</h3>
      <div class="why-grid">
        <div class="why-item">
          <div class="why-icon">🎯</div>
          <h5>Персональный подход</h5>
          <p>Подбираем туры под ваши предпочтения.</p>
        </div>
        <div class="why-item">
          <div class="why-icon">⚡</div>
          <h5>Быстрая поддержка</h5>
          <p>Помогаем 24/7 в любое время.</p>
        </div>
        <div class="why-item">
          <div class="why-icon">🛡️</div>
          <h5>Надёжность</h5>
          <p>Только проверенные направления.</p>
        </div>
      </div>
    </div>

    <!-- Consultation Form -->
    <div class="consultation-form">
      <h3>Оставьте заявку на консультацию</h3>
      <form @submit.prevent="submitConsultation">
        <input v-model="consultationName" type="text" placeholder="Ваше имя" required />
        <input v-model="consultationPhone" type="tel" placeholder="Ваш номер телефона" required />
        <button type="submit" :disabled="loading">Отправить</button>
      </form>
      <p v-if="consultationError" class="error">{{ consultationError }}</p>
    </div>

    <!-- Footer Section -->
    <footer>
      <div class="footer-content">
        <div class="footer-section">
          <img :src="logotype" alt="Logotype" class="footer-logotype" />
          <p>Путешествия по Казахстану</p>
        </div>
        <div class="footer-section">
          <h3>Контакты</h3>
          <p>Email: info@tripai.kz</p>
          <p>Тел: +7 (777) 123-45-67</p>
        </div>
      </div>
    </footer>

    <!-- Modals -->
    <RegisterModal
      v-if="!isAuthenticated"
      :show="showRegisterModal"
      @close="showRegisterModal = false"
      @register-success="handleAuthSuccess"
      @login-success="handleAuthSuccess"
    />
    <ProfileModal
      v-if="isAuthenticated"
      :show="showProfileModal"
      :user="user"
      @close="showProfileModal = false"
      @logout="handleLogout"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import AIGenerate from './components/AIGenerate.vue';
import CitySelector from './components/CitySelector.vue';
import RegisterModal from './components/RegisterModal.vue';
import ProfileModal from './components/ProfileModal.vue';
import burgerMenu from './img/icon menu.png';
import logotype from './img/Logotype.png';
import searchIcon from './img/Search 24px.png';
import userIcon from './img/User 24px.png';
import heartIcon from './img/Heart.png';
import heartFilledIcon from './img/HeartFilled.png';
import welcomeImage from './img/image-1.png';
import almaty from './img/almaty.jpeg';
import astana from './img/astana.jpg';
import borovoe from './img/borovoe.jpg';
import shymkent from './img/shymkent.JPG';

export default defineComponent({
  name: 'App',
  components: {
    AIGenerate,
    CitySelector,
    RegisterModal,
    ProfileModal,
  },
  setup() {
    const router = useRouter();
    return { router };
  },
  data() {
    return {
      aiToggle: false,
      tours: [
        {
          id: 1,
          title: 'Тур в Боровое',
          description: 'Увлекательное путешествие в Боровое с проживанием в отеле Rixos.',
          price: '50000 KZT',
          location: 'Боровое',
          image: borovoe,
        },
        {
          id: 2,
          title: 'Тур в Алматы',
          description: 'Поездка в Алматы с посещением Медео и Кок-Тобе.',
          price: '45000 KZT',
          location: 'Алматы',
          image: almaty,
        },
        {
          id: 3,
          title: 'Тур в Астану',
          description: 'Обзорная экскурсия по достопримечательностям Астаны.',
          price: '40000 KZT',
          location: 'Астана',
          image: astana,
        },
        {
          id: 4,
          title: 'Тур в Шымкент',
          description: 'Путешествие в Шымкент с посещением исторических мест.',
          price: '42000 KZT',
          location: 'Шымкент',
          image: shymkent,
        },
      ],
      loading: false,
      error: null,
      consultationName: '',
      consultationPhone: '',
      consultationError: null,
      favorites: [],
      userCity: null,
      needsFlight: false,
      showRegisterModal: false,
      showProfileModal: false,
      user: null,
      isAuthenticated: false,
      isSidebarOpen: false,
      showTranslatorModal: false,
      sourceLang: 'RU',
      targetLang: 'EN',
      textToTranslate: '',
      translatedText: '',
      burgerMenu,
      logotype,
      searchIcon,
      userIcon,
      heartIcon,
      heartFilledIcon,
      welcomeImage,
      almaty,
      shymkent,
      astana,
      borovoe,
    };
  },
  methods: {
    handleCitySelected({ city, needsFlight }) {
      this.userCity = city;
      this.needsFlight = needsFlight;
      localStorage.setItem('userCity', city);
      localStorage.setItem('needsFlight', needsFlight.toString());
      this.router.push({ name: 'Home' }).catch((err) => {
        console.error('Router push error:', err);
        this.error = 'Не удалось перейти на главную страницу';
      });
    },
    handleTours(tours) {
      console.log('Received tours:', tours);
      this.loading = true;
      this.error = null;
      try {
        if (Array.isArray(tours) && tours.length) {
          this.tours = tours.map((tour) => ({
            ...tour,
            id: tour.id || Date.now() + Math.random(),
            title: tour.title || 'Тур не указан',
            price: tour.price || 'Цена не указана KZT',
            location: tour.location || 'Местоположение не указано',
            description: tour.description || 'Описание отсутствует',
            image: tour.image || '/img/placeholder.jpg',
          }));
        } else {
          this.error = 'Некорректные данные туров';
        }
      } catch (err) {
        this.error = err.message || 'Ошибка обработки туров';
        console.error('Tour handling error:', err);
      } finally {
        this.loading = false;
      }
    },
    goToTourDetails(tour) {
      if (!tour || typeof tour !== 'object') {
        this.error = 'Некорректные данные тура';
        console.error('Invalid tour data:', tour);
        return;
      }
      let tourNeedsFlight = this.needsFlight;
      if (tour.description) {
        const hasFlightKeywords = ['перелет', 'самолет', 'авиа', 'полетите', 'через Кокшетау'].some(
          (keyword) => tour.description.includes(keyword)
        );
        const hasCarKeywords = [
          'межгородное такси',
          'автомобиль',
          'на автомобиле',
          'прямо из Астаны',
        ].some((keyword) => tour.description.includes(keyword));
        tourNeedsFlight =
          hasFlightKeywords && !hasCarKeywords
            ? true
            : hasCarKeywords
            ? false
            : this.needsFlight;
      }
      const citiesWithAirports = ['Астана', 'Алматы', 'Шымкент', 'Караганда', 'Актобе'];
      if (this.userCity && this.userCity !== tour.location) {
        if (citiesWithAirports.includes(this.userCity) && !tour.description?.includes('межгородное такси')) {
          tourNeedsFlight = true;
        }
      }
      this.router.push({
        name: 'TourDetails',
        query: {
          tour: JSON.stringify(tour),
          needsFlight: tourNeedsFlight.toString(),
          userCity: this.userCity || 'Астана',
        },
      }).catch((err) => {
        this.error = 'Не удалось открыть детали тура';
        console.error('Router push error:', err);
      });
    },
    toggleFavorite(tour) {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const index = favorites.findIndex((fav) => fav.id === tour.id);
      if (index === -1) {
        favorites.push(tour);
      } else {
        favorites.splice(index, 1);
      }
      this.favorites = favorites;
      localStorage.setItem('favorites', JSON.stringify(favorites));
    },
    isFavorite(tour) {
      return this.favorites.some((fav) => fav.id === tour.id);
    },
    async submitConsultation() {
      if (!this.consultationName || !this.consultationPhone) {
        this.consultationError = 'Пожалуйста, заполните все поля.';
        return;
      }
      this.loading = true;
      this.consultationError = null;
      try {
        await axios.post(
          'http://localhost:5001/api/consultation',
          {
            name: this.consultationName,
            phone: this.consultationPhone,
          },
          { headers: { 'Content-Type': 'application/json' } }
        );
        this.consultationName = '';
        this.consultationPhone = '';
        alert('Заявка отправлена! Наш менеджер свяжется с вами.');
      } catch (err) {
        this.consultationError = err.response?.data?.error || 'Ошибка отправки. Попробуйте позже.';
        console.error('Consultation error:', err);
      } finally {
        this.loading = false;
      }
    },
    handleAuthSuccess(user) {
      this.user = user;
      this.isAuthenticated = true;
      this.showRegisterModal = false;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', user.token);
    },
    handleLogout() {
      this.user = null;
      this.isAuthenticated = false;
      this.showProfileModal = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    checkAuth() {
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (user && token) {
        this.user = JSON.parse(user);
        this.isAuthenticated = true;
      }
    },
    loadFavorites() {
      this.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    },
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
    },
    async translateText() {
  if (!this.textToTranslate) {
    this.translatedText = 'Введите текст для перевода';
    return;
  }
  try {
    console.log('Отправка запроса на /api/translate:', {
      text: [this.textToTranslate],
      target_lang: this.targetLang,
      source_lang: this.sourceLang,
    });
    const response = await axios.post('/api/translate', {
      text: [this.textToTranslate],
      target_lang: this.targetLang,
      source_lang: this.sourceLang,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.translatedText = response.data.translations[0].text;
    console.log('Успешный перевод:', this.translatedText);
  } catch (error) {
    console.error('Ошибка перевода:', error.message, error.response?.data);
    this.translatedText = 'Ошибка перевода. Проверьте подключение или ключ.';
    if (error.response?.status === 404) {
      this.translatedText += ' (Маршрут не найден на сервере)';
    }
  }
  },
  },
  computed: {
    apiKey() {
      return '1310cf39-0650-41f6-b08a-ff76a7968884:fx';
    },
  },
  mounted() {
    this.loadFavorites();
    this.userCity = localStorage.getItem('userCity') || 'Астана';
    this.needsFlight = localStorage.getItem('needsFlight') === 'true';
    this.checkAuth();
    console.log('Tours on mount:', this.tours);
  },
  watch: {
    '$route.query.tour': {
      immediate: true,
      handler(newTour) {
        if (newTour) {
          try {
            const tour = JSON.parse(newTour);
            this.needsFlight = tour.description?.includes('перелет') || this.needsFlight;
          } catch (err) {
            console.error('Route query parse error:', err);
            this.needsFlight = false;
          }
        }
      },
    },
  },
});
</script>

<style scoped>
/* Header with corrected size and width */
header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100vw;
  max-width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 40px;
  height: 160px;
  background: linear-gradient(135deg, rgba(55, 95, 87, 0.9), rgba(30, 61, 54, 0.9));
  backdrop-filter: blur(15px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  box-sizing: border-box;
  animation: slideInFromTop 0.8s ease-out;
  opacity: 80%;
}

@keyframes slideInFromTop {
  0% { transform: translateY(-100%); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

header:hover {
  background: linear-gradient(135deg, rgba(55, 95, 87, 0.95), rgba(30, 61, 54, 0.95));
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.5);
  transform: translateY(-2px);
}

.burger-div {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 22px;
  animation: fadeIn 1s ease-in-out;
  cursor: pointer;
}

.burger-div p {
  font-size: 1.1rem;
  font-weight: 500;
  color: #d1e8e2;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
  margin: 0;
  transition: transform 0.3s ease;
}

.burger-div:hover p {
  transform: scale(1.05);
}

.burger-menu,
.search-icon,
.user-icon,
.favorite-icon {
  width: 26px;
  height: 26px;
  transition: transform 0.3s ease, filter 0.3s ease;
  cursor: pointer;
  animation: popIn 0.5s ease-in-out;
}

@keyframes popIn {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); }
}

.burger-menu:hover,
.search-icon:hover,
.user-icon:hover,
.favorite-icon:hover {
  transform: scale(1.2) rotate(5deg);
  filter: brightness(1.3) drop-shadow(0 0 10px rgba(67, 181, 129, 0.5));
}

.logotype {
  height: 60px;
  width: 60px;
  cursor: pointer;
  transition: transform 0.5s ease;
  animation: rotateIn 1s ease-out;
}

.logotype:hover {
  transform: rotate(360deg) scale(1.1);
}

@keyframes rotateIn {
  0% { transform: rotate(-180deg) scale(0.5); opacity: 0; }
  100% { transform: rotate(0) scale(1); opacity: 1; }
}

.right-panel {
  display: flex;
  align-items: center;
  gap: 20px;
  animation: slideInFromRight 0.8s ease-out;
}

@keyframes slideInFromRight {
  0% { transform: translateX(100px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

/* Sidebar Styles */
.sidebar {
  position: fixed;
  top: 0;
  left: -250px;
  width: 250px;
  height: 100%;
  background: #1e3a32;
  color: #e0f7f0;
  padding: 20px;
  transition: left 0.3s ease, visibility 0s linear 0.3s;
  z-index: 1001;
  overflow-y: auto;
  visibility: hidden;
}

.sidebar.open {
  left: 0;
  visibility: visible;
  transition: left 0.3s ease;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 1.5rem;
  background: none;
  border: none;
  color: #a8d8c9;
  cursor: pointer;
}

.sidebar h3 {
  margin-top: 0;
  text-align: center;
}

.sidebar ul {
  list-style: none;
  padding: 0;
}

.sidebar ul li {
  margin: 15px 0;
}

.sidebar ul li a {
  color: #a8d8c9;
  text-decoration: none;
}

.sidebar ul li a:hover {
  color: #43b581;
}

.translator-trigger {
  margin-top: 20px;
  padding: 10px;
  background: #2e8b57;
  color: white;
  text-align: center;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.3s ease;
}

.translator-trigger:hover {
  background: #43b581;
  transform: translateY(-2px);
}

/* Translator Modal Styles */
.translator-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease-out;
}

.translator-modal {
  background: #1e3a32;
  padding: 20px;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  position: relative;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  0% { transform: translateY(-50px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.modal-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 1.5rem;
  background: none;
  border: none;
  color: #a8d8c9;
  cursor: pointer;
  transition: color 0.3s ease;
}

.modal-close-btn:hover {
  color: #e57373;
}

.translator-modal h3 {
  color: #d1e8e2;
  text-align: center;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

.lang-select {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 2px solid #43b581;
  border-radius: 25px;
  background: #d1e8e2;
  color: #375f57;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.lang-select:focus {
  border-color: #2e8b57;
  box-shadow: 0 0 10px rgba(46, 139, 87, 0.5);
  outline: none;
}

.translate-input {
  width: 95%;
  padding: 10px;
  margin: 10px 0;
  border: 2px solid #43b581;
  border-radius: 25px;
  background: #d1e8e2;
  color: #375f57;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.translate-input:focus {
  border-color: #2e8b57;
  box-shadow: 0 0 10px rgba(46, 139, 87, 0.5);
  outline: none;
}

.translate-btn {
  margin-top: 10px;
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #43b581, #2e8b57);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
}

.translate-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.translate-btn:hover::before {
  left: 100%;
}

.translate-btn:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 6px 15px rgba(67, 181, 129, 0.5);
}

.translated-text {
  margin-top: 15px;
  color: #c5e8dd;
  font-size: 1.1rem;
  padding: 10px;
  background: rgba(30, 61, 54, 0.7);
  border-radius: 5px;
  text-align: center;
  word-wrap: break-word;
}

/* Adjust app-content padding to account for smaller header */
.app-content {
  padding-top: 120px;
  box-sizing: border-box;
  overflow-x: hidden;
}

.welcome-div {
  width: 100%;
  padding: 20px 60px;
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  perspective: 1000px;
}

.welcome-img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  margin-bottom: 20px;
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  animation: imageFadeIn 1.2s ease-out;
  transition: transform 0.5s ease;
}

.welcome-img:hover {
  transform: translateZ(20px) scale(1.02);
}

@keyframes imageFadeIn {
  0% { opacity: 0; transform: translateY(50px); }
  100% { opacity: 1; transform: translateY(0); }
}

.ai-search {
  text-align: center;
  margin-top: 30px;
  position: relative;
  top: -290px;
  animation: slideUp 1s ease-out 0.5s both;
}

@keyframes slideUp {
  0% { transform: translateY(100px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.ai-btn {
  padding: 15px 35px;
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffffff;
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  border: none;
  border-radius: 30px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
  transition: all 0.3s ease;
  font-family: 'Arial', sans-serif;
  position: relative;
  overflow: hidden;
}

.ai-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.ai-btn:hover::before {
  left: 100%;
}

.ai-btn:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 12px 35px rgba(76, 175, 80, 0.7);
  background: linear-gradient(135deg, #45a049, #2e7d32);
}

.ai-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Tours Section with scroll-triggered animations */
.tours-container {
  width: 100%;
  padding: 40px 60px;
  background: rgba(30, 61, 54, 0.95);
  margin: 40px 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: visible;
}

.tours-container h2 {
  font-size: 2rem;
  color: #d1e8e2;
  margin-bottom: 30px;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
  font-weight: bold;
  animation: fadeIn 1s ease-out;
}

.tours-flex {
  display: flex;
  flex-direction: row;
  gap: 30px;
  max-width: 1200px;
  width: 100%;
  justify-content: center;
  flex-wrap: nowrap;
}

.tour-item {
  background: linear-gradient(145deg, rgba(67, 181, 129, 0.1), rgba(46, 125, 50, 0.1));
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  cursor: pointer;
  border: 2px solid transparent;
  width: 300px;
  flex: 0 0 300px;
  opacity: 0;
  transform: translateY(50px);
  animation: slideInUp 0.8s ease-out forwards;
}

.tour-item:nth-child(1) { animation-delay: 0.2s; }
.tour-item:nth-child(2) { animation-delay: 0.4s; }
.tour-item:nth-child(3) { animation-delay: 0.6s; }
.tour-item:nth-child(4) { animation-delay: 0.8s; }

@keyframes slideInUp {
  0% { opacity: 0; transform: translateY(50px); }
  100% { opacity: 1; transform: translateY(0); }
}

.tour-item:hover {
  transform: translateY(-10px) scale(1.05) rotateX(5deg);
  box-shadow: 0 20px 50px rgba(67, 181, 129, 0.5);
  border-color: rgba(67, 181, 129, 0.7);
  z-index: 10;
}

.tour-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  position: relative;
  overflow: hidden;
}

.tour-image::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.3));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.tour-item:hover .tour-image::before {
  opacity: 1;
}

.tour-content {
  padding: 25px;
  text-align: center;
  transform: translateZ(0);
}

.tour-content h3 {
  font-size: 1.5rem;
  color: #d1e8e2;
  margin: 0 0 15px 0;
  font-weight: bold;
  transition: color 0.3s ease;
}

.tour-item:hover .tour-content h3 {
  color: #43b581;
}

.tour-desc {
  font-size: 1.1rem;
  color: #b0c4b1;
  margin: 0 0 20px 0;
  line-height: 1.5;
  opacity: 0.9;
  transition: opacity 0.3s ease;
}

.tour-item:hover .tour-desc {
  opacity: 1;
}

.tour-price {
  font-size: 1.4rem;
  color: #43b581;
  font-weight: bold;
  margin-bottom: 20px;
  position: relative;
}

.tour-price::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  width: 0;
  height: 2px;
  background: #43b581;
  transition: width 0.3s ease, left 0.3s ease;
}

.tour-item:hover .tour-price::after {
  width: 50%;
  left: 25%;
}

.tour-action {
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
  transition: all 0.4s ease;
  font-family: 'Arial', sans-serif;
  position: relative;
  overflow: hidden;
}

.view-tour-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.view-tour-btn:hover::before {
  left: 100%;
}

.view-tour-btn:hover {
  background: linear-gradient(135deg, #2e8b57, #1b5e20);
  transform: translateY(-3px) scale(1.1);
  box-shadow: 0 8px 20px rgba(67, 181, 129, 0.6);
}

.favorite-btn {
  background: transparent;
  border: none;
  padding: 12px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.favorite-btn:hover {
  transform: scale(1.3) rotate(10deg);
}

.favorite-btn-icon {
  width: 24px;
  height: 24px;
  transition: all 0.3s ease;
  animation: heartbeat 1.5s ease-in-out infinite;
}

@keyframes heartbeat {
  0% { transform: scale(1); }
  20% { transform: scale(1.2); }
  40% { transform: scale(1); }
}

/* Why Us Section with staggered animations */
.why-us {
  width: 100%;
  padding: 60px 60px;
  background: rgba(55, 95, 87, 0.8);
  margin: 40px 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.why-us h3 {
  font-size: 2.2rem;
  text-align: center;
  color: #d1e8e2;
  margin-bottom: 40px;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
  font-weight: bold;
  animation: fadeIn 1s ease-out;
}

.why-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.why-item {
  background: rgba(30, 61, 54, 0.9);
  border-radius: 20px;
  padding: 30px 20px;
  text-align: center;
  transition: all 0.5s ease;
  border: 2px solid transparent;
  opacity: 0;
  transform: scale(0.8);
  animation: popUp 0.8s ease-out forwards;
}

.why-item:nth-child(1) { animation-delay: 0.2s; }
.why-item:nth-child(2) { animation-delay: 0.4s; }
.why-item:nth-child(3) { animation-delay: 0.6s; }

@keyframes popUp {
  0% { opacity: 0; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
}

.why-item:hover {
  transform: translateY(-10px) scale(1.05);
  box-shadow: 0 15px 35px rgba(67, 181, 129, 0.5);
  border-color: rgba(67, 181, 129, 0.7);
  background: rgba(30, 61, 54, 1);
}

.why-icon {
  font-size: 3rem;
  margin-bottom: 20px;
  display: block;
  transition: transform 0.3s ease;
}

.why-item:hover .why-icon {
  transform: rotate(360deg);
}

.why-item h5 {
  font-size: 1.5rem;
  color: #43b581;
  margin: 0 0 15px 0;
  font-weight: bold;
  position: relative;
}

.why-item h5::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  width: 0;
  height: 2px;
  background: #43b581;
  transition: width 0.3s ease, left 0.3s ease;
}

.why-item:hover h5::after {
  width: 50%;
  left: 25%;
}

.why-item p {
  font-size: 1.1rem;
  color: #b0c4b1;
  line-height: 1.6;
  margin: 0;
}

/* Consultation Form with input animations */
.consultation-form {
  width: 100%;
  padding: 60px 60px;
  background: rgba(30, 61, 54, 0.95);
  margin: 40px 0;
  text-align: center;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeIn 1s ease-out;
}

.consultation-form h3 {
  font-size: 2rem;
  color: #d1e8e2;
  margin-bottom: 30px;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
  font-weight: bold;
}

.consultation-form form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 450px;
  margin: 0 auto;
}

.consultation-form input {
  padding: 15px 20px;
  font-size: 1.1rem;
  border: 2px solid transparent;
  border-radius: 30px;
  background: #d1e8e2;
  color: #375f57;
  outline: none;
  transition: all 0.3s ease;
  font-family: 'Arial', sans-serif;
  position: relative;
  animation: slideInLeft 0.8s ease-out;
}

.consultation-form input:focus {
  box-shadow: 0 0 20px rgba(67, 181, 129, 0.7);
  border-color: #43b581;
  transform: translateY(-3px) scale(1.02);
}

@keyframes slideInLeft {
  0% { transform: translateX(-50px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

.consultation-form button {
  padding: 15px 30px;
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffffff;
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  border: none;
  border-radius: 30px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
  transition: all 0.4s ease;
  font-family: 'Arial', sans-serif;
  position: relative;
  overflow: hidden;
}

.consultation-form button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.consultation-form button:hover::before {
  left: 100%;
}

.consultation-form button:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 12px 35px rgba(76, 175, 80, 0.7);
  background: linear-gradient(135deg, #45a049, #2e7d32);
}

.consultation-form button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.error {
  color: #e57373;
  font-size: 1.1rem;
  margin-top: 15px;
  padding: 10px;
  background: rgba(58, 34, 34, 0.8);
  border-radius: 10px;
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-10px); }
  40%, 80% { transform: translateX(10px); }
}

/* Footer with fade-in animation */
footer {
  width: 100%;
  padding: 40px 60px;
  background: rgba(30, 61, 54, 0.95);
  border-top: 3px solid #d1e8e2;
  box-shadow: 0 -8px 25px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
  animation: fadeIn 1s ease-out;
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
  animation: slideInUp 0.8s ease-out;
}

.footer-section:nth-child(1) { animation-delay: 0.2s; }
.footer-section:nth-child(2) { animation-delay: 0.4s; }

.footer-logotype {
  width: 60px;
  height: 60px;
  margin-bottom: 15px;
  transition: transform 0.5s ease;
}

.footer-logotype:hover {
  transform: rotate(360deg);
}

.footer-section p {
  font-size: 1.1rem;
  color: #b0c4b1;
  line-height: 1.6;
  margin: 5px 0;
  transition: color 0.3s ease;
}

.footer-section p:hover {
  color: #43b581;
}

.footer-section h3 {
  font-size: 1.5rem;
  color: #d1e8e2;
  margin-bottom: 15px;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
  font-weight: bold;
}

/* Responsive Adjustments */
@media (max-width: 1024px) {
  .tours-flex {
    flex-direction: column;
    align-items: center;
  }
  .tour-item {
    width: 100%;
    max-width: 500px;
    flex: 0 0 auto;
  }
  .why-grid {
    grid-template-columns: 1fr;
    gap: 25px;
    max-width: 500px;
  }
  .footer-content {
    flex-direction: column;
    gap: 30px;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .app-content {
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
  .burger-menu,
  .search-icon,
  .user-icon,
  .favorite-icon {
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
  .welcome-div,
  .tours-container,
  .why-us,
  .consultation-form,
  footer {
    padding: 30px 20px;
  }
  .ai-search {
    top: -200px;
  }
  .ai-btn {
    padding: 12px 25px;
    font-size: 1rem;
  }
  .tour-content {
    padding: 20px;
  }
  .why-us h3,
  .consultation-form h3 {
    font-size: 1.8rem;
  }
  .why-item {
    padding: 25px 15px;
  }
  .consultation-form form {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  header {
    padding: 10px 15px;
    height: 100px;
  }
  .app-content {
    padding-top: 100px;
  }
  .burger-div p {
    font-size: 0.9rem;
  }
  .burger-menu,
  .search-icon,
  .user-icon,
  .favorite-icon {
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
  .welcome-div,
  .tours-container,
  .why-us,
  .consultation-form,
  footer {
    padding: 20px 15px;
  }
  .ai-search {
    top: -150px;
  }
  .ai-btn {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
  .tour-image {
    height: 150px;
  }
  .tour-content {
    padding: 15px;
  }
  .tour-content h3 {
    font-size: 1.3rem;
  }
  .tour-desc {
    font-size: 1rem;
  }
  .tour-price {
    font-size: 1.2rem;
  }
  .why-us h3,
  .consultation-form h3 {
    font-size: 1.5rem;
  }
  .why-item {
    padding: 20px 10px;
  }
  .why-icon {
    font-size: 2.5rem;
  }
  .why-item h5 {
    font-size: 1.3rem;
  }
  .why-item p {
    font-size: 1rem;
  }
}
</style>