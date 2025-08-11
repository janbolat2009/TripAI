<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal" @click.stop>
      <button class="close-btn" @click="$emit('close')">&times;</button>

      <h3 class="modal-title">Создайте идеальный тур с ИИ</h3>

      <textarea v-model="preferences" placeholder="Например: тур в Турцию, 7 дней, бюджет до 1000 евро..." class="preferences-input" rows="5"></textarea>

      <button @click="submit" :disabled="loading" class="generate-btn">
        <span v-if="loading">Генерация...</span>
        <span v-else>Сгенерировать тур</span>
      </button>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>ИИ подбирает лучшие туры...</p>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else-if="tours.length" class="tours-grid">
        <div
          v-for="tour in tours"
          :key="tour.title"
          class="tour-card"
          @click="showDetails(tour)"
        >
          <h4>{{ tour.title }}</h4>
          <p class="tour-description">{{ tour.description }}</p>
          <div class="tour-footer">
            <p class="tour-price">{{ tour.price }}</p>
            <p class="tour-location">{{ tour.location }}</p>
          </div>
          <p v-if="tour.error" class="tour-error">{{ tour.error }}</p>
        </div>
      </div>

      <TourDetails
        v-if="selectedTour"
        :tour="selectedTour"
        @close="selectedTour = null"
      />
    </div>
  </div>
</template>

<script>
import TourDetails from './TourDetails.vue';

export default {
  components: {
    TourDetails,
  },
  props: {
    tours: { type: Array, default: () => [] },
    error: { type: String, default: null },
    loading: { type: Boolean, default: false },
  },
  emits: ['close', 'generate'],
  data() {
    return {
      preferences: '',
      selectedTour: null,
    };
  },
  methods: {
    submit() {
      this.$emit('generate', this.preferences || 'тур на 7 дней, бюджет до 1000 евро, с посещением Алматы и природных достопримечательностей');
    },
    showDetails(tour) {
      this.selectedTour = tour;
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.6s ease-out;
}

.modal {
  background: linear-gradient(145deg, rgba(45, 84, 77, 0.95), rgba(30, 61, 54, 0.95));
  backdrop-filter: blur(10px);
  width: 90%;
  max-width: 800px;
  border-radius: 25px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: slideUp 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 25px;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 2.5rem;
  color: #d1e8e2;
  background: none;
  border: none;
  cursor: pointer;
  transition: transform 0.3s ease, color 0.3s ease;
}

.close-btn:hover {
  color: #43b581;
  transform: rotate(90deg) scale(1.2);
}

.modal-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: #d1e8e2;
  text-align: center;
  text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.4);
  margin-bottom: 20px;
}

.preferences-input {
  width: 100%;
  padding: 15px;
  border-radius: 15px;
  border: 1px solid rgba(74, 122, 112, 0.5);
  background: rgba(30, 61, 54, 0.8);
  color: #d1e8e2;
  font-size: 1.1rem;
  resize: none;
  box-shadow: inset 0 3px 10px rgba(0, 0, 0, 0.3);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.preferences-input:focus {
  outline: none;
  border-color: #43b581;
  box-shadow: 0 0 12px rgba(67, 181, 129, 0.5);
}

.generate-btn {
  width: 100%;
  max-width: 350px;
  padding: 15px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(90deg, #43b581, #2e8b57);
  border: none;
  border-radius: 30px;
  cursor: pointer;
  box-shadow: 0 5px 20px rgba(67, 181, 129, 0.6);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(67, 181, 129, 0.8);
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading {
  text-align: center;
  color: #d1e8e2;
  margin: 30px 0;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #43b581;
  border-top: 5px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

.error-message {
  color: #e57373;
  background: rgba(58, 34, 34, 0.8);
  padding: 15px;
  border-radius: 12px;
  text-align: center;
  margin: 20px 0;
  border: 1px solid rgba(94, 48, 48, 0.5);
  font-size: 1.1rem;
}

.tours-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  width: 100%;
  margin-top: 30px;
}

.tour-card {
  background: linear-gradient(135deg, rgba(30, 61, 54, 0.9), rgba(26, 50, 45, 0.9));
  padding: 25px;
  border-radius: 20px;
  border: 1px solid rgba(58, 106, 96, 0.3);
  cursor: pointer;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.tour-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 10px 30px rgba(67, 181, 129, 0.5);
}

.tour-card h4 {
  font-size: 1.5rem;
  color: #d1e8e2;
  margin: 0;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
}

.tour-description {
  font-size: 1.1rem;
  color: #b0c4b1;
  line-height: 1.6;
  margin: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.tour-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.tour-price {
  font-size: 1.2rem;
  color: #43b581;
  font-weight: 600;
  margin: 0;
}

.tour-location {
  font-size: 1.1rem;
  color: #b0c4b1;
  margin: 0;
}

.tour-error {
  font-size: 1rem;
  color: #e57373;
  background: rgba(58, 34, 34, 0.8);
  padding: 10px;
  border-radius: 8px;
  margin-top: 10px;
  text-align: center;
}

/* Анимации */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
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
    padding: 25px;
    border-radius: 15px;
  }

  .modal-title {
    font-size: 1.8rem;
  }

  .generate-btn {
    padding: 12px;
    font-size: 1.1rem;
  }

  .tours-grid {
    grid-template-columns: 1fr;
  }

  .tour-card {
    padding: 20px;
  }
}
</style>