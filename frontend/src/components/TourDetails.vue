<template>
  <div class="overlay" @click="$emit('close')">
    <div class="modal" @click.stop>
      <button class="close" @click="$emit('close')">&times;</button>

      <div class="tour-header">
        <h2>{{ tour.title }}</h2>
        <p class="tour-location">{{ tour.location }}</p>
      </div>

      <div class="tour-details">
        <p class="tour-description">{{ tour.description }}</p>
        <p class="tour-price"><strong>Цена тура:</strong> {{ tour.price }}</p>

        <div v-if="hotelsLoading" class="loading-hotels">
          <div class="spinner"></div>
          <p>Загрузка отелей...</p>
        </div>
        <div v-else-if="hotelsError" class="error-hotels">
          {{ hotelsError }}
        </div>
        <div v-else-if="hotels.length" class="hotels-section">
          <h3>Рекомендуемые отели</h3>
          <div class="hotels-grid">
            <div v-for="hotel in hotels" :key="hotel.name" class="hotel-card">
              <img :src="hotel.photo" alt="Отель" class="hotel-photo" />
              <div class="hotel-info">
                <h4>{{ hotel.name }}</h4>
                <p>Цена: {{ hotel.price }} USD</p>
                <p>Рейтинг: {{ hotel.rating }}/10</p>
                <a :href="hotel.link" target="_blank" class="book-btn">Забронировать</a>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="no-hotels">Отели не найдены</p>
      </div>

      <div v-if="mapLoaded" id="map" class="map"></div>
      <p v-else class="loading-map">Загрузка карты...</p>

      <div v-if="tour.flights && tour.flights.length" class="flights">
        <h3>Рекомендуемые перелёты</h3>
        <div v-for="flight in tour.flights" :key="flight.id" class="flight">
          <p>Цена: {{ flight.price }} USD</p>
          <p>Дата вылета: {{ flight.departure_at }}</p>
          <p>Авиакомпания: {{ flight.airline }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: { tour: { type: Object, required: true } },
  data() {
    return {
      mapLoaded: false,
      hotels: [],
      hotelsLoading: false,
      hotelsError: null,
    };
  },
  async mounted() {
    await this.loadYandexMaps();
    this.initMap();
    await this.loadHotels();
  },
  methods: {
    async loadYandexMaps() {
      return new Promise((resolve) => {
        if (window.ymaps) {
          window.ymaps.ready(resolve);
          return;
        }
        const script = document.createElement('script');
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=${import.meta.env.VITE_YANDEX_API_KEY}&lang=ru_RU`;
        script.onload = () => window.ymaps.ready(resolve);
        document.head.appendChild(script);
      });
    },
    initMap() {
      const city = this.tour.location.split(',')[0].trim();
      window.ymaps.geocode(city, { results: 1 }).then(res => {
        const coords = res.geoObjects.get(0).geometry.getCoordinates();
        new window.ymaps.Map('map', { center: coords, zoom: 12 });
        this.mapLoaded = true;
      }).catch(() => {
        this.mapLoaded = false;
      });
    },
    async loadHotels() {
      this.hotelsLoading = true;
      this.hotelsError = null;
      try {
        console.log(`[TourDetails.vue] Запрос отелей для ${this.tour.location}`);
        const response = await axios.get('http://localhost:5001/api/hotels', {
          params: { city: this.tour.location.split(',')[0].trim() },
        });
        this.hotels = response.data || [];
        if (!this.hotels.length) {
          this.hotelsError = `Отели для ${this.tour.location} не найдены`;
        }
        console.log(`[TourDetails.vue] Отели получены:`, this.hotels);
      } catch (error) {
        console.error('[TourDetails.vue] Ошибка загрузки отелей:', error.response?.data || error.message);
        this.hotelsError = error.response?.data?.error || `Ошибка загрузки отелей для ${this.tour.location}`;
        this.hotels = [];
      } finally {
        this.hotelsLoading = false;
      }
    },
  },
};
</script>

<style scoped>
/* Стили без изменений */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(15px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
  animation: fadeIn 0.8s ease-out;
}

.modal {
  background: linear-gradient(145deg, rgba(45, 84, 77, 0.95), rgba(30, 61, 54, 0.95));
  backdrop-filter: blur(12px);
  width: 90%;
  max-width: 1000px;
  border-radius: 30px;
  padding: 50px;
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: epicZoom 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  max-height: 90vh;
  overflow-y: auto;
  color: #d1e8e2;
  clip-path: polygon(0 10%, 100% 0, 100% 90%, 0 100%);
}

.close {
  position: absolute;
  top: 25px;
  right: 25px;
  font-size: 3rem;
  color: #d1e8e2;
  background: none;
  border: none;
  cursor: pointer;
  transition: transform 0.4s ease, color 0.3s ease;
}

.close:hover {
  color: #43b581;
  transform: rotate(360deg) scale(1.3);
}

.tour-header {
  text-align: center;
  margin-bottom: 40px;
  animation: slideIn 0.6s ease-out 0.2s both;
}

.tour-header h2 {
  font-size: 2.8rem;
  font-weight: 700;
  color: #d1e8e2;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.5);
  margin: 0;
}

.tour-location {
  font-size: 1.4rem;
  color: #b0c4b1;
  margin: 15px 0 0;
}

.tour-details {
  margin: 40px 0;
  animation: slideIn 0.6s ease-out 0.3s both;
}

.tour-description {
  font-size: 1.3rem;
  line-height: 1.8;
  color: #b0c4b1;
  margin-bottom: 20px;
}

.tour-price {
  font-size: 1.5rem;
  color: #43b581;
  font-weight: 600;
  margin-bottom: 30px;
}

.hotels-section {
  margin-top: 30px;
}

.hotels-section h3 {
  font-size: 2rem;
  color: #d1e8e2;
  text-align: center;
  margin-bottom: 30px;
  text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.3);
}

.hotels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

.hotel-card {
  background: linear-gradient(135deg, rgba(30, 61, 54, 0.9), rgba(26, 50, 45, 0.9));
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  transition: transform 0.4s ease, box-shadow 0.4s ease;
  animation: slideIn 0.6s ease-out 0.4s both;
}

.hotel-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 12px 30px rgba(67, 181, 129, 0.5);
}

.hotel-photo {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.hotel-info {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hotel-info h4 {
  font-size: 1.5rem;
  color: #d1e8e2;
  margin: 0;
}

.hotel-info p {
  font-size: 1.2rem;
  color: #b0c4b1;
  margin: 0;
}

.book-btn {
  display: inline-block;
  padding: 12px 25px;
  background: linear-gradient(90deg, #43b581, #2e8b57);
  color: #fff;
  text-decoration: none;
  border-radius: 12px;
  font-size: 1.1rem;
  text-align: center;
  transition: background 0.3s ease, transform 0.3s ease;
}

.book-btn:hover {
  background: linear-gradient(90deg, #3fa372, #2a7b4b);
  transform: translateY(-3px);
}

.loading-hotels {
  text-align: center;
  color: #b0c4b1;
  margin: 30px 0;
}

.loading-hotels .spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #43b581;
  border-top: 4px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

.error-hotels {
  text-align: center;
  color: #e57373;
  background: rgba(58, 34, 34, 0.8);
  padding: 15px;
  border-radius: 12px;
  margin: 30px 0;
  border: 1px solid rgba(94, 48, 48, 0.5);
  font-size: 1.2rem;
}

.no-hotels {
  text-align: center;
  color: #e57373;
  font-size: 1.2rem;
  margin: 30px 0;
}

.map {
  width: 100%;
  height: 450px;
  border-radius: 20px;
  margin: 40px 0;
  background: #1e3d36;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.6s ease-out 0.5s both;
}

.loading-map {
  text-align: center;
  color: #b0c4b1;
  font-size: 1.2rem;
  margin: 40px 0;
}

.flights {
  margin-top: 40px;
  animation: slideIn 0.6s ease-out 0.6s both;
}

.flights h3 {
  font-size: 2rem;
  color: #d1e8e2;
  text-align: center;
  margin-bottom: 30px;
  text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.3);
}

.flight {
  background: linear-gradient(135deg, rgba(30, 61, 54, 0.9), rgba(26, 50, 45, 0.9));
  padding: 25px;
  border-radius: 15px;
  margin-bottom: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.flight p {
  font-size: 1.2rem;
  color: #b0c4b1;
  margin: 10px 0;
}

/* Анимации */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes epicZoom {
  from {
    opacity: 0;
    transform: scale(0.6) rotate(-10deg);
    clip-path: polygon(0 10%, 100% 0, 100% 90%, 0 100%);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
    clip-path: polygon(0 10%, 100% 0, 100% 90%, 0 100%);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 600px) {
  .modal {
    padding: 30px;
    border-radius: 20px;
  }

  .tour-header h2 {
    font-size: 2.2rem;
  }

  .tour-location {
    font-size: 1.2rem;
  }

  .tour-description {
    font-size: 1.1rem;
  }

  .tour-price {
    font-size: 1.3rem;
  }

  .hotels-section h3, .flights h3 {
    font-size: 1.6rem;
  }

  .hotels-grid {
    grid-template-columns: 1fr;
  }

  .hotel-photo {
    height: 250px;
  }

  .hotel-info {
    padding: 15px;
  }

  .map {
    height: 350px;
  }
}
</style>