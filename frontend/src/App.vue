<template>
  <body>
    <header>
      <div class="burger-div">
        <img src="./img/icon menu.png" alt="Menu" class="burger-menu">
        <p>Каталог</p>
      </div>
      <img src="./img/Logotype.png" alt="Logotype" class="logotype">
      <div class="right-panel">
        <img src="./img/Search 24px.png" alt="Search" class="search-icon">
        <img src="./img/User 24px.png" alt="User" class="user-icon">
        <img src="./img/Heart.png" alt="Favorite" class="favorite-icon">
      </div>
    </header>

    <div class="welcome-div">
      <img src="./img/image-1.png" alt="Welcome Image" class="welcome-img">
      <div class="ai-search">
        <button @click="aiToggle = true" class="ai-btn">
          Найти туры с ИИ
        </button>
      </div>
    </div>

    <AIGenerate
      v-if="aiToggle"
      @close="aiToggle = false"
      @generate="generateTour"
      :tours="tours"
      :error="error"
      :loading="loading"
    />
  </body>
</template>

<script>
import AIGenerate from './components/AIGenerate.vue';
import axios from 'axios';

export default {
  components: {
    AIGenerate,
  },
  data() {
    return {
      aiToggle: false,
      tours: [],
      loading: false,
      error: null,
    };
  },
  methods: {
    async generateTour(preferences) {
      this.loading = true;
      this.error = null;
      this.tours = [];

      try {
        console.log('[App.vue] Генерация туров с prompt:', preferences);
        const aiResponse = await axios.post('http://localhost:5001/api/ai', {
          prompt: preferences || 'тур на 7 дней, бюджет до 1000 евро, с посещением Алматы и природных достопримечательностей',
        });

        this.tours = Array.isArray(aiResponse.data.tour) ? aiResponse.data.tour : [];
        console.log('[App.vue] Туры получены:', this.tours);

        for (let tour of this.tours) {
          try {
            console.log(`[App.vue] Запрос отелей для ${tour.location}`);
            const hotelResponse = await axios.get('http://localhost:5001/api/hotels', {
              params: { city: tour.location.split(',')[0].trim() },
            });
            tour.hotels = hotelResponse.data || [];
            if (!tour.hotels.length) {
              tour.error = `Отели для ${tour.location} не найдены`;
            }
            console.log(`[App.vue] Отели для ${tour.location}:`, tour.hotels);
          } catch (hotelError) {
            console.error(`[App.vue] Ошибка при получении отелей для ${tour.location}:`, hotelError.response?.data || hotelError.message);
            tour.hotels = [];
            tour.error = hotelError.response?.data?.error || `Ошибка загрузки отелей для ${tour.location}`;
          }

          try {
            console.log(`[App.vue] Запрос перелётов для ${tour.location}`);
            const city = tour.location.split(',')[0].trim();
            // Маппинг городов на IATA-коды
            const cityToIata = {
              'Алматы': 'ALA',
              'Кольсай': 'ALA',
              'Катон Карагай': 'ALA', // Ближайший аэропорт — Алматы
              'Астана': 'TSE',
            };
            const destinationCode = cityToIata[city] || 'ALA'; // Fallback на ALA
            const flightResponse = await axios.get('http://localhost:5001/api/flights', {
              params: {
                origin: 'MOW',
                destination: destinationCode,
                departure_at: '2025-09-15', // Ближайшая дата
              },
            });
            tour.flights = flightResponse.data.data || [];
            if (!tour.flights.length && flightResponse.data.error) {
              tour.error = tour.error ? `${tour.error}; ${flightResponse.data.error}` : flightResponse.data.error;
            }
            console.log(`[App.vue] Перелёты для ${tour.location}:`, tour.flights);
          } catch (flightError) {
            console.error(`[App.vue] Ошибка при получении перелётов для ${tour.location}:`, flightError.response?.data || flightError.message);
            tour.flights = [];
            if (!tour.error) {
              tour.error = flightError.response?.data?.error || 'Не удалось загрузить перелёты';
            } else {
              tour.error += '; Не удалось загрузить перелёты';
            }
          }
        }

        this.aiToggle = true;
      } catch (err) {
        this.error = err.response?.data?.error || 'Ошибка при генерации тура. Проверьте API или интернет.';
        console.error('[App.vue] Ошибка генерации тура:', err.response?.data || err.message);
        this.tours = [];
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
/* Стили без изменений */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  background-color: #375f57;
  color: #ffffff;
  padding-top: 200px;
  overflow-x: hidden;
}

header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  padding: 20px 120px;
  height: 175px;
  background: rgba(55, 95, 87, 0.7);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  transition: all 0.3s ease;
  opacity: 70%;
}

header:hover {
  background: rgba(55, 95, 87, 0.9);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
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
}

.burger-menu, .logotype, .search-icon, .user-icon, .favorite-icon {
  width: 30px;
  height: 30px;
  transition: transform 0.3s ease;
}

.burger-menu:hover, .search-icon:hover, .user-icon:hover, .favorite-icon:hover {
  transform: scale(1.1);
  filter: brightness(1.2);
}

.logotype {
  height: 70px;
  width: 70px;
}

.right-panel {
  display: flex;
  align-items: center;
  gap: 25px;
}

.welcome-div {
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  padding: 20px;
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  z-index: 10;
}

.welcome-img {
  width: 100%;
  max-width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  margin-bottom: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.welcome-div h3 {
  font-size: 1.5rem;
  text-align: center;
  line-height: 1.6;
  color: #d1e8e2;
  padding: 0 20px;
  margin-bottom: 30px;
  text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.3);
}

.ai-search {
  text-align: center;
  margin-top: 30px;
  position: relative;
  top: -290px;
}

.ai-btn {
  padding: 12px 25px;
  font-size: 1.1rem;
  font-weight: bold;
  color: #ffffff;
  background: linear-gradient(90deg, #4caf50, #2e7d32);
  border: none;
  border-radius: 25px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
  transition: all 0.3s ease;
}

.ai-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.6);
  background: linear-gradient(90deg, #45a049, #2e7d32);
}

.ai-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.ai-btn span {
  display: inline-block;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@media (max-width: 768px) {
  body {
    padding-top: 20%;
  }

  header {
    padding: 3% 5%;
    height: 15%;
  }

  .burger-div {
    gap: 3%;
  }

  .burger-div p {
    font-size: 4vw;
  }

  .burger-menu, .logotype, .search-icon, .user-icon, .favorite-icon {
    width: 8%;
    height: auto;
  }

  .logotype {
    width: 15%;
    height: auto;
  }

  .right-panel {
    gap: 5%;
  }

  .welcome-div {
    padding: 3%;
  }

  .welcome-img {
    border-radius: 2%;
    margin-bottom: 5%;
  }

  .welcome-div h3 {
    font-size: 5vw;
    padding: 0 5%;
    margin-bottom: 7%;
  }

  .ai-search {
    margin-top: 7%;
    top: -25%;
  }

  .ai-btn {
    padding: 3% 6%;
    font-size: 4vw;
    border-radius: 5vw;
  }
}

@media (max-width: 480px) {
  header {
    padding: 2% 4%;
    height: 12%;
  }

  .burger-div p {
    font-size: 3.5vw;
  }

  .burger-menu, .logotype, .search-icon, .user-icon, .favorite-icon {
    width: 7%;
  }

  .logotype {
    width: 12%;
  }

  .right-panel {
    gap: 4%;
  }

  .welcome-div {
    padding: 2%;
  }

  .welcome-img {
    margin-bottom: 4%;
  }

  .welcome-div h3 {
    font-size: 4.5vw;
    margin-bottom: 6%;
  }

  .ai-search {
    margin-top: 6%;
    top: -20%;
  }

  .ai-btn {
    padding: 2.5% 5%;
    font-size: 3.5vw;
  }
}
</style>