<template>
  <div class="overlay" @click="router.push({ name: 'Home' })">
    <div class="modal" @click.stop>
      <button class="close-btn" @click="router.push({ name: 'Home' })">&times;</button>

      <div class="tour-header">
        <h2 class="tour-title">{{ tour.title || 'Тур не найден' }}</h2>
        <p class="tour-location">{{ tour.location || 'Местоположение неизвестно' }}</p>
        <p v-if="tour.latitude && tour.longitude" class="tour-coords">
          Координаты: {{ tour.latitude }}, {{ tour.longitude }}
        </p>
      </div>

      <div class="tour-content">
        <div class="tour-description">
          <p>{{ tour.description || 'Описание отсутствует' }}</p>
          <p class="tour-price"><strong>Цена тура:</strong> {{ tour.price || 'Цена не указана' }}</p>
        </div>

        <button @click="showGuide = true" class="guide-btn">
        <img src="@/img/chat-icon.png" alt="Chat" class="chat-icon" />
        </button>
        <TourGuideChat v-if="showGuide" :tour="tour" :is-open="showGuide" @close="showGuide = false" />

        <!-- Ошибки -->
        <div v-if="errors.length" class="error-section">
          <h4>Возникли ошибки:</h4>
          <p v-for="(error, index) in errors" :key="`error-${index}`" class="error">{{ error }}</p>
        </div>

        <!-- Рейсы -->
        <div v-if="flightsLoading && shouldLoadFlights" class="loading-section">
          <div class="spinner"></div>
          <p>Загрузка рейсов...</p>
        </div>
        <section v-else-if="flights.length && shouldLoadFlights" class="section flights-section">
          <h3>Доступные рейсы</h3>
          <div class="grid">
            <div v-for="(flight, index) in flights" :key="`flight-${index}`" class="card flight-card animate-slide-up">
              <h4>{{ flight.origin || 'N/A' }} → {{ flight.destination || 'N/A' }}</h4>
              <p>Дата: {{ formatDate(flight.date) }}</p>
              <p>Вылет: {{ flight.departure || 'N/A' }}</p>
              <p>Прибытие: {{ flight.arrival || 'N/A' }}</p>
              <p>Длительность: {{ flight.duration || 'N/A' }}</p>
              <p>Цена: {{ flight.price || 'N/A' }}</p>
              <p v-if="flight.stops">Пересадки: {{ flight.stops }} (через {{ flight.via || 'N/A' }})</p>
              <a :href="flight.link || '#'" target="_blank" class="book-btn">Забронировать</a>
            </div>
          </div>
        </section>
        <p v-else-if="shouldLoadFlights" class="no-data">Рейсы не найдены</p>

        <!-- Отели -->
        <div v-if="hotelsLoading" class="loading-section">
          <div class="spinner"></div>
          <p>Загрузка отелей...</p>
        </div>
        <section v-else-if="hotels.length" class="section hotels-section">
          <h3>Рекомендуемые отели</h3>
          <div class="grid">
            <div v-for="hotel in hotels" :key="hotel.hotel_id || hotel.name" class="card hotel-card animate-slide-up">
              <img :src="hotel.photo || placeholderImage" :alt="hotel.name" class="card-image" @error="onImageError" />
              <div class="card-content">
                <h4>{{ hotel.name || 'Название отеля' }}</h4>
                <p>Цена: {{ hotel.price || 'Не указана' }}</p>
                <p>Рейтинг: ⭐ {{ hotel.rating || 'N/A' }}</p>
                <p>Адрес: {{ hotel.address || 'Не указан' }}</p>
                <p>Телефон: {{ hotel.phone || 'Не указан' }}</p>
                <a :href="hotel.link || '#'" target="_blank" class="book-btn">Забронировать</a>
                <p v-if="hotel.photoAuthor" class="photo-credit">Фото: {{ hotel.photoAuthor }} на Unsplash</p>
              </div>
            </div>
          </div>
        </section>
        <p v-else class="no-data">Отели не найдены</p>

        <!-- Такси -->
        <div v-if="taxiLoading" class="loading-section">
          <div class="spinner"></div>
          <p>Загрузка такси...</p>
        </div>
        <section v-else-if="taxiOptions.length" class="section taxi-section">
          <h3>Доступные услуги такси {{ shouldLoadFlights ? 'от аэропорта до отеля' : '' }}</h3>
          <div class="grid">
            <div v-for="taxi in taxiOptions" :key="taxi.id" class="card taxi-card animate-slide-up">
              <h4>{{ taxi.company || 'N/A' }}</h4>
              <p>Цена (примерно): {{ taxi.price || 'N/A' }}</p>
              <p>Время подачи: {{ taxi.eta || 'N/A' }}</p>
              <a :href="taxi.link || '#'" target="_blank" class="book-btn">Заказать</a>
            </div>
          </div>
        </section>
        <p v-else class="no-data">Услуги такси не найдены</p>

        <!-- Карта -->
        <div v-if="tour.latitude && tour.longitude" class="map-section animate-fade-in">
          <h3>Карта местоположения</h3>
          <div id="map" class="map"></div>
        </div>
        <p v-if="mapError" class="no-data">{{ mapError }}</p>
        <div v-if="!mapLoaded && !mapError && tour.latitude && tour.longitude" class="loading-section">
          <div class="spinner"></div>
          <p>Загрузка карты...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import placeholderImage from '../img/placeholder.jpg';
import TourGuideChat from './TourGuideChat.vue';

axiosRetry(axios, { retries: 2, retryDelay: (retryCount) => retryCount * 1000 });

export default {
  name: 'TourDetails',
  components: { TourGuideChat },
  props: {
    userCity: { type: String, default: 'Астана' },
    tour: { type: Object, default: () => ({}) },
    needsFlight: { type: Boolean, default: false }, // Добавлен пропс для динамического управления рейсами
  },
  setup(props) {
    const flights = ref([]);
    const flightsLoading = ref(false);
    const hotels = ref([]);
    const hotelsLoading = ref(false);
    const taxiOptions = ref([]);
    const taxiLoading = ref(false);
    const mapLoaded = ref(false);
    const mapError = ref(null);
    const errors = ref([]);
    const showGuide = ref(false); // Управление отображением тургида
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const route = useRoute();
    const router = useRouter();

    const shouldLoadFlights = computed(() => true); 

    const formatDate = (dateString) => {
      try {
        return new Date(dateString).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
      } catch (error) {
        return dateString || 'N/A';
      }
    };

    const onImageError = (event) => {
      event.target.src = placeholderImage;
    };

    const loadMap = async () => {
      if (!props.tour.latitude || !props.tour.longitude) {
        mapError.value = 'Координаты тура отсутствуют';
        errors.value.push(mapError.value);
        return;
      }
      if (!import.meta.env.VITE_YANDEX_MAPS_API_KEY) {
        mapError.value = 'Ошибка: VITE_YANDEX_MAPS_API_KEY не настроен';
        errors.value.push(mapError.value);
        return;
      }
      try {
        await loadYandexMaps();
        await nextTick();
        const mapContainer = document.getElementById('map');
        if (!mapContainer) throw new Error('Контейнер карты не найден');
        window.ymaps.ready(() => {
          const map = new window.ymaps.Map('map', {
            center: [props.tour.latitude, props.tour.longitude],
            zoom: 12,
            controls: ['zoomControl', 'fullscreenControl'],
          });
          const placemark = new window.ymaps.Placemark(
            [props.tour.latitude, props.tour.longitude],
            { balloonContent: props.tour.title || 'Тур' }
          );
          map.geoObjects.add(placemark);
          mapLoaded.value = true;
        });
      } catch (error) {
        mapError.value = 'Ошибка загрузки карты: ' + error.message;
        errors.value.push(mapError.value);
      }
    };

    const loadYandexMaps = () => {
      return new Promise((resolve, reject) => {
        if (window.ymaps) return resolve();
        const script = document.createElement('script');
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=${import.meta.env.VITE_YANDEX_MAPS_API_KEY}&lang=ru_RU`;
        script.async = true;
        script.onload = () => window.ymaps.ready(resolve);
        script.onerror = () => reject(new Error('Не удалось загрузить Yandex Maps API'));
        document.head.appendChild(script);
      });
    };

    
    const loadHotels = async () => {
  hotelsLoading.value = true;
  try {
    const { latitude, longitude } = props.tour;
    if (!latitude || !longitude) {
      console.warn('[TourDetails] Координаты тура отсутствуют, используем координаты из location:', props.tour.location);
      const destCity = props.tour.location?.split(',')[0].trim() || 'Боровое';
      const coords = cityCoordinates[destCity] || cityCoordinates['Алматы']; // По умолчанию Алматы
      latitude = coords.lat;
      longitude = coords.lng;
    }
    console.log('[TourDetails] Запрос отелей для координат:', { latitude, longitude });
    const response = await axios.post(`${apiUrl}/api/hotels`, {
      textQuery: `hotels near ${latitude},${longitude}`,
      latitude,
      longitude,
    }, { timeout: 15000 });
    console.log('[TourDetails] Ответ от /api/hotels:', response.data);
    hotels.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('[TourDetails] Ошибка загрузки отелей:', error.message);
    errors.value.push(`Ошибка загрузки отелей: ${error.message}`);
  } finally {
    hotelsLoading.value = false;
  }
  };

   const cityToAirportCode = {
  'Боровое': 'KOV', // Исправлено на аэропорт Кокшетау
  'Алматы': 'ALA',
  'Астана': 'NQZ',
  'Шымкент': 'CIT',
  'Караганда': 'KGF',
  'Актобе': 'AKX',
  'Кокшетау': 'KOV',
  'Тараз': 'CIT',
  'Павлодар': 'PWQ',
  'Усть-Каменогорск': 'UKK',
  'Семей': 'PLX',
  'Атырау': 'GUW',
};

const loadFlights = async () => {
  if (!shouldLoadFlights.value) {
    console.log('[TourDetails] Flights not loaded: shouldLoadFlights is false');
    return;
  }
  flightsLoading.value = true;
  try {
    const userCity = props.userCity || 'Астана';
    const destinationCity = props.tour.location?.split(',')[0].trim() || 'Боровое';
    console.log('[TourDetails] Loading flights for:', { userCity, destinationCity });

    const origin = cityToAirportCode[userCity] || 'NQZ';
    const destination = cityToAirportCode[destinationCity] || (destinationCity === 'Боровое' ? 'KOV' : 'ALA');

    console.log('[TourDetails] Flight route:', { origin, destination });
    if (origin === destination) {
      flights.value = [];
      console.log('[TourDetails] Origin and destination are the same, no flights needed');
      return;
    }

    const today = new Date();
    const departureDate = today.toISOString().split('T')[0]; // 2025-09-03
    const returnDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const prompt = `Хочу в ${destinationCity} на 3 дня`; // Добавляем prompt

    const response = await axios.post(`${apiUrl}/api/flights/init`, {
      prompt,
      origin,
      destination,
      departure_at: departureDate,
      return_at: returnDate,
      userCity: props.userCity,
    }, { timeout: 30000 });

    console.log('[TourDetails] Flight response:', response.data);
    flights.value = Array.isArray(response.data.flights) ? response.data.flights : [];
    if (flights.value.length === 0) {
      errors.value.push('Нет доступных рейсов для выбранных дат.');
    }
  } catch (error) {
    console.error('[TourDetails] Error loading flights:', error.message, error.response?.data);
    errors.value.push(`Ошибка загрузки рейсов: ${error.message}`);
    flights.value = [];
  } finally {
    flightsLoading.value = false;
  }
};

    const loadTaxi = async () => {
      taxiLoading.value = true;
      try {
        const from = shouldLoadFlights.value ? `${props.tour.location?.split(',')[0].trim() || 'Боровое'} Airport` : props.userCity || 'Астана';
        const to = props.tour.location?.split(',')[0].trim() || 'Боровое';
        const response = await axios.get(`${apiUrl}/api/taxi`, {
          params: { from, to, needsFlight: shouldLoadFlights.value },
          timeout: 15000,
        });
        taxiOptions.value = Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        errors.value.push(`Ошибка загрузки такси: ${error.message}`);
      } finally {
        taxiLoading.value = false;
      }
    };

    onMounted(async () => {
      console.log('[TourDetails] Полученный тур:', props.tour);
      console.log('[TourDetails] Location:', props.tour.location);
      console.log('[TourDetails] Координаты:', props.tour.latitude, props.tour.longitude);

      if (!apiUrl) {
        errors.value.push('Ошибка: VITE_API_URL не настроен');
        return;
      }
      await Promise.allSettled([loadMap(), loadHotels(), loadTaxi(), loadFlights()]);
    });

    return {
      flights,
      flightsLoading,
      hotels,
      hotelsLoading,
      taxiOptions,
      taxiLoading,
      mapLoaded,
      mapError,
      errors,
      showGuide,
      placeholderImage,
      shouldLoadFlights,
      formatDate,
      onImageError,
      router,
    };
  },
};
</script>


<style scoped>
/* TourDetails.css */
* {
  font-family: 'Segoe UI', 'Roboto', sans-serif;
  box-sizing: border-box;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(15, 30, 25, 0.9)),
              url('/img/background-blur.jpg') no-repeat center center;
  background-size: cover;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
  padding: 20px;
  overflow-x: hidden;
  animation: fadeIn 0.6s ease-out;
}

.modal {
  background: linear-gradient(145deg, #1e3a32, #122620);
  width: 100%;
  max-width: 900px;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(67, 181, 129, 0.3);
  color: #e0f7f0;
  overflow-y: auto;
  max-height: 90vh;
  backdrop-filter: blur(10px);
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 2rem;
  color: #a8d8c9;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(67, 181, 129, 0.3);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #43b581;
  background: rgba(67, 181, 129, 0.2);
  transform: scale(1.15);
  box-shadow: 0 0 10px rgba(67, 181, 129, 0.4);
}

.tour-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(67, 181, 129, 0.2);
}

.tour-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 10px;
  color: #ffffff;
  text-shadow: 1px 1px 8px rgba(0, 0, 0, 0.5);
  letter-spacing: -0.5px;
}

.tour-location {
  font-size: 1.2rem;
  color: #a8d8c9;
  margin: 5px 0;
}

.tour-coords {
  font-size: 1rem;
  color: #88c0b0;
  margin: 5px 0;
  font-style: italic;
}

.tour-description {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 30px;
  backdrop-filter: blur(8px);
}

.tour-description p {
  font-size: 1.1rem;
  color: #c5e8dd;
  line-height: 1.7;
  margin: 0;
}

.tour-price {
  margin-top: 20px;
  font-size: 1.4rem;
  color: #43d9a2;
  font-weight: 700;
  text-align: center;
  padding: 12px;
  background: rgba(67, 217, 162, 0.15);
  border-radius: 12px;
  margin-top: 15px;
  border: 1px solid rgba(67, 217, 162, 0.3);
}

.guide-btn {
  padding: 10px;
  background: linear-gradient(90deg, #43b581, #2e8b57);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 20px;
  transition: background 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
}

.guide-btn:hover {
  background: #43b581;
}

.chat-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.guide-btn .fas {
  font-size: 1.5rem; /* Размер иконки */
}

.section h3 {
  font-size: 1.9rem;
  color: #e0f7f0;
  text-align: center;
  margin-bottom: 20px;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.4s ease;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 15px 35px rgba(67, 181, 129, 0.35);
}

.card-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 12px;
  border: 2px solid rgba(67, 181, 129, 0.2);
}

.card-content h4 {
  font-size: 1.3rem;
  color: #ffffff;
  margin: 0 0 10px;
  font-weight: 600;
}

.card-content p {
  font-size: 0.95rem;
  color: #c5e8dd;
  margin: 5px 0;
}

.photo-credit {
  font-size: 0.8rem;
  color: #a8d8c9;
  margin: 8px 0 0;
  font-style: italic;
}

.book-btn {
  display: inline-block;
  margin-top: 12px;
  padding: 10px 18px;
  background: linear-gradient(90deg, #43d9a2, #3cb081);
  color: #fff;
  text-decoration: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(67, 217, 162, 0.3);
}

.book-btn:hover {
  background: #43b581;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(67, 181, 129, 0.4);
}

.loading-section,
.error-section,
.no-data {
  text-align: center;
  padding: 20px;
  border-radius: 12px;
  margin: 20px 0;
}

.loading-section {
  background: rgba(20, 40, 35, 0.7);
  color: #a8d8c9;
}

.loading-section .spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #43d9a2;
  border-top: 4px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

.error-section,
.no-data {
  background: rgba(80, 30, 30, 0.7);
  color: #e57373;
  border: 1px solid rgba(229, 115, 115, 0.3);
}

.map-section {
  margin-top: 30px;
}

.map {
  width: 100%;
  height: 350px;
  border-radius: 14px;
  background: rgba(20, 40, 35, 0.8);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(67, 181, 129, 0.2);
}

/* Анимации */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.animate-slide-up {
  animation: slideUp 0.5s ease-out forwards;
  opacity: 0;
}

@keyframes slideUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.8s ease-out;
}

/* Адаптив */
@media (max-width: 768px) {
  .modal { padding: 20px; max-width: 95%; }
  .tour-title { font-size: 2rem; }
  .grid { gap: 16px; }
  .card-image { height: 140px; }
  .map { height: 280px; }
}

@media (max-width: 480px) {
  .modal { padding: 15px; }
  .close-btn { top: 10px; right: 10px; width: 35px; height: 35px; font-size: 1.6rem; }
  .tour-title { font-size: 1.7rem; }
  .card-image { height: 120px; }
  .map { height: 220px; }
  .tour-price { font-size: 1.2rem; }
}
</style>