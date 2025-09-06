<template>
  <div class="tour-guide-overlay" @click.self="closeChat">
    <div class="tour-guide-modal">
      <button class="close-btn" @click="closeChat">&times;</button>
      <h3 class="guide-title">Ваш виртуальный тургид</h3>
      <div class="chat-container">
        <div v-for="(message, index) in chatHistory" :key="index" class="message" :class="{ 'user-message': message.isUser }">
          {{ message.text }}
        </div>
      </div>
      <div class="input-area">
        <textarea v-model="userInput" @keyup.enter="sendMessage" placeholder="Задайте вопрос..." rows="2" class="input-field"></textarea>
        <button @click="sendMessage" :disabled="!userInput.trim()" class="send-btn">Отправить</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'TourGuideChat',
  props: {
    tour: { type: Object, required: true },
    isOpen: { type: Boolean, default: false },
  },
  emits: ['close'],
  data() {
    return {
      userInput: '',
      chatHistory: [],
      loading: false,
    };
  },
  methods: {
    closeChat() {
      this.$emit('close');
    },
    async sendMessage() {
  if (!this.userInput.trim()) return;

  const message = { text: this.userInput, isUser: true };
  this.chatHistory.push(message);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const context = {
    location: this.tour.location || 'не указано',
    description: this.tour.description || 'не указано',
    latitude: this.tour.latitude || null,
    longitude: this.tour.longitude || null,
  };
  console.log('[TourGuideChat] Отправляемые данные:', { prompt: this.userInput, context });

  this.loading = true;
  try {
    const response = await axios.post(
      `${apiUrl}/api/tourguide`,
      {
        prompt: this.userInput,
        context,
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
    );
    const botResponse = { text: response.data.response, isUser: false };
    this.chatHistory.push(botResponse);
  } catch (error) {
    if (error.response) {
      console.error('[TourGuideChat] Ошибка сервера:', error.response.data);
      this.chatHistory.push({ text: `Ошибка: ${error.response.data.error || 'Не удалось получить ответ.'}`, isUser: false });
    } else {
      this.chatHistory.push({ text: 'Извините, не удалось получить ответ. Попробуйте позже.', isUser: false });
    }
    console.error('[TourGuideChat] Ошибка:', error);
  } finally {
    this.loading = false;
    this.userInput = ''; 
  }
},
  },
};
</script>

<style scoped>
.tour-guide-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3001;
  animation: fadeIn 0.3s ease-out;
}

.tour-guide-modal {
  background: linear-gradient(145deg, #1e3a32, #122620);
  width: 90%;
  max-width: 500px;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(67, 181, 129, 0.3);
  color: #e0f7f0;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 1.8rem;
  color: #a8d8c9;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: #43b581;
}

.guide-title {
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 10px;
  color: #ffffff;
}

.chat-container {
  flex-grow: 1;
  overflow-y: auto;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  margin-bottom: 10px;
}

.message {
  padding: 8px 12px;
  margin: 5px 0;
  border-radius: 8px;
  max-width: 80%;
  word-wrap: break-word;
}

.user-message {
  background: rgba(67, 181, 129, 0.2);
  color: #d1e8e2;
  margin-left: auto;
}

.input-area {
  display: flex;
  gap: 10px;
}

.input-field {
  flex-grow: 1;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(67, 181, 129, 0.3);
  background: rgba(30, 61, 54, 0.8);
  color: #d1e8e2;
  resize: none;
  transition: border-color 0.3s ease;
}

.input-field:focus {
  outline: none;
  border-color: #43b581;
}

.send-btn {
  padding: 10px 20px;
  background: linear-gradient(90deg, #43b581, #2e8b57);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  background: #43b581;
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>