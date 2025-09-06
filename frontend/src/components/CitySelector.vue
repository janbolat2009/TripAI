<template>
  <div v-if="showCitySelector" class="city-selector-overlay">
    <div class="city-selector-modal">
      <h3>Ваш город {{ defaultCity }}?</h3>
      <div class="city-actions">
        <button @click="confirmCity('Да')" class="action-btn yes-btn">Да</button>
        <button @click="showCityList = true" class="action-btn change-btn">Нет, изменить</button>
      </div>
      <div v-if="showCityList" class="city-list">
        <select v-model="selectedCity" @change="selectCity" class="city-select">
          <option value="" disabled selected hidden>Выберите город</option>
          <option v-for="city in cities" :key="city.name" :value="city.name">
            {{ city.name }}
          </option>
        </select>
        <button @click="confirmCity('Подтвердить')" class="action-btn confirm-btn">Подтвердить</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showCitySelector: true,
      showCityList: false,
      selectedCity: '',
      defaultCity: 'Астана',
      cities: [
  { name: 'Астана', airport: 'NQZ', needsFlight: true },
  { name: 'Алматы', airport: 'ALA', needsFlight: true },
  { name: 'Шымкент', airport: 'CIT', needsFlight: true },
  { name: 'Караганда', airport: 'KGF', needsFlight: true },
  { name: 'Актобе', airport: 'AKX', needsFlight: true },
  { name: 'Павлодар', airport: 'PWQ', needsFlight: true },
  { name: 'Усть-Каменогорск', airport: 'UKK', needsFlight: true },
  { name: 'Семей', airport: 'PLX', needsFlight: true },
  { name: 'Атырау', airport: 'GUW', needsFlight: true },
  { name: 'Боровое', airport: null, needsFlight: false }, // Без аэропорта
  { name: 'Кокшетау', airport: null, needsFlight: false }, // Без аэропорта, близко к Астане
  { name: 'Тараз', airport: null, needsFlight: false }, // Без аэропорта, близко к Шымкенту
],
    };
  },
  methods: {
    confirmCity(action) {
      const cityName = this.selectedCity || this.defaultCity;
      const cityData = this.cities.find(c => c.name === cityName);
      
      console.log('[CitySelector] Выбран город:', cityName, 'данные:', cityData);
      
      this.$emit('citySelected', { 
        city: cityName, 
        needsFlight: cityData?.needsFlight || false,
        airport: cityData?.airport || null
      });
      
      this.showCitySelector = false;
    },
    selectCity() {
      // Не скрываем список сразу, пользователь должен подтвердить выбор
      console.log('[CitySelector] Выбран город из списка:', this.selectedCity);
    },
  },
};
</script>

<style scoped>
/* Стили остаются без изменений, как в предыдущем варианте */
.city-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.city-selector-modal {
  background: linear-gradient(135deg, #2d544d, #1e3d36);
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  text-align: center;
  color: #e0f2e9;
  width: 90%;
  max-width: 400px;
  transform: scale(0);
  animation: popIn 0.3s ease-out forwards;
}

h3 {
  font-size: 1.8rem;
  margin-bottom: 20px;
  font-weight: 600;
  text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.3);
}

.city-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
}

.action-btn {
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #fff;
  font-weight: 500;
}

.yes-btn {
  background: linear-gradient(90deg, #43b581, #2e8b57);
}

.yes-btn:hover {
  background: linear-gradient(90deg, #2e8b57, #43b581);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(67, 181, 129, 0.4);
}

.change-btn {
  background: linear-gradient(90deg, #e57373, #f44336);
}

.change-btn:hover {
  background: linear-gradient(90deg, #f44336, #e57373);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(229, 115, 115, 0.4);
}

.city-list {
  margin-top: 20px;
  opacity: 0;
  animation: slideUp 0.3s ease-out forwards;
}

.city-select {
  padding: 10px 15px;
  border: 2px solid #43b581;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #e0f2e9;
  font-size: 1rem;
  width: 60%;
  margin-right: 10px;
  outline: none;
  transition: border-color 0.3s ease;
}

.city-select:focus {
  border-color: #2e8b57;
}

.city-select option {
  background: #2d544d;
  color: #e0f2e9;
}

.confirm-btn {
  padding: 12px 25px;
  background: linear-gradient(90deg, #43b581, #2e8b57);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-btn:hover {
  background: linear-gradient(90deg, #2e8b57, #43b581);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(67, 181, 129, 0.4);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes popIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 480px) {
  .city-selector-modal {
    padding: 20px;
    max-width: 90%;
  }

  h3 {
    font-size: 1.5rem;
  }

  .action-btn {
    padding: 10px 15px;
    font-size: 1rem;
  }

  .city-select {
    width: 50%;
    padding: 8px 10px;
  }

  .confirm-btn {
    padding: 10px 15px;
    font-size: 1rem;
  }
}
</style>