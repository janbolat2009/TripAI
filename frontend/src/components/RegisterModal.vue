<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content" :class="{ 'fade-in': show }">
      <button class="close-btn" @click="$emit('close')">&times;</button>
      <h2>{{ isLogin ? 'Вход' : 'Регистрация' }}</h2>
      <div class="form-toggle">
        <button
          class="toggle-btn"
          :class="{ active: !isLogin }"
          @click="isLogin = false"
        >
          Регистрация
        </button>
        <button
          class="toggle-btn"
          :class="{ active: isLogin }"
          @click="isLogin = true"
        >
          Вход
        </button>
      </div>
      <form v-if="!isLogin" @submit.prevent="registerUser" class="form">
        <input
          v-model="name"
          type="text"
          placeholder="Ваше имя"
          required
          class="input-field"
        />
        <input
          v-model="email"
          type="email"
          placeholder="Ваш email"
          required
          class="input-field"
        />
        <input
          v-model="password"
          type="password"
          placeholder="Пароль"
          required
          class="input-field"
        />
        <button type="submit" :disabled="loading" class="action-btn">
          {{ loading ? 'Загрузка...' : 'Зарегистрироваться' }}
        </button>
      </form>
      <form v-else @submit.prevent="loginUser" class="form">
        <input
          v-model="email"
          type="email"
          placeholder="Ваш email"
          required
          class="input-field"
        />
        <input
          v-model="password"
          type="password"
          placeholder="Пароль"
          required
          class="input-field"
        />
        <button type="submit" :disabled="loading" class="action-btn">
          {{ loading ? 'Загрузка...' : 'Войти' }}
        </button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: {
    show: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      isLogin: false,
      name: '',
      email: '',
      password: '',
      loading: false,
      error: null,
    };
  },
  methods: {
    async registerUser() {
      this.loading = true;
      this.error = null;
      if (!this.name || !this.email || !this.password) {
        this.error = 'Заполните все поля';
        this.loading = false;
        return;
      }
      try {
        const response = await axios.post(
          'http://localhost:5001/api/register',
          {
            name: this.name,
            email: this.email,
            password: this.password,
          },
          { headers: { 'Content-Type': 'application/json' } }
        );
        this.name = '';
        this.email = '';
        this.password = '';
        this.$emit('register-success', response.data.user);
        this.$emit('close');
        alert('Регистрация прошла успешно!');
      } catch (err) {
        this.error = err.response?.data?.error || 'Ошибка регистрации';
        console.error('[Register Error]', err);
      } finally {
        this.loading = false;
      }
    },
    async loginUser() {
      this.loading = true;
      this.error = null;
      if (!this.email || !this.password) {
        this.error = 'Заполните все поля';
        this.loading = false;
        return;
      }
      try {
        const response = await axios.post(
          'http://localhost:5001/api/login',
          {
            email: this.email,
            password: this.password,
          },
          { headers: { 'Content-Type': 'application/json' } }
        );
        this.email = '';
        this.password = '';
        this.$emit('login-success', response.data.user);
        this.$emit('close');
        alert(`Вход успешен! Добро пожаловать, ${response.data.user.name}`);
      } catch (err) {
        this.error = err.response?.data?.error || 'Ошибка входа';
        console.error('[Login Error]', err);
      } finally {
        this.loading = false;
      }
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
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  position: relative;
  background: rgba(55, 95, 87, 0.95);
  padding: 40px 30px 30px;
  border-radius: 15px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  color: #e0f2e9;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.modal-content.fade-in {
  opacity: 1;
  transform: translateY(0);
}

.modal-content h2 {
  margin-bottom: 20px;
  font-size: 28px;
  text-align: center;
  font-weight: 600;
  color: #a3d9b1;
}

.form-toggle {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.toggle-btn {
  background: none;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  color: #a3d9b1;
  cursor: pointer;
  transition: color 0.3s ease, background 0.3s ease;
}

.toggle-btn.active,
.toggle-btn:hover {
  color: #fff;
  background: rgba(88, 129, 87, 0.8);
  border-radius: 8px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
}

.input-field {
  width: 100%;
  max-width: 400px;
  padding: 12px;
  margin: 0;
  border: 1px solid #a3d9b1;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #e0f2e9;
  font-size: 16px;
  box-sizing: border-box;
  transition: border-color 0.3s ease, background 0.3s ease;
}

.input-field:focus {
  outline: none;
  border-color: #47b38f;
  background: rgba(255, 255, 255, 0.15);
}

.action-btn {
  width: 100%;
  max-width: 400px;
  padding: 12px;
  background: #47b38f;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  background: #3a916d;
  transform: scale(1.02);
}

.action-btn:disabled {
  background: #588157;
  cursor: not-allowed;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 24px;
  color: #a3d9b1;
  cursor: pointer;
  transition: color 0.3s ease, transform 0.3s ease;
}

.close-btn:hover {
  color: #fff;
  transform: rotate(90deg);
}

.error {
  color: #ff6b6b;
  font-size: 14px;
  text-align: center;
  margin-top: 10px;
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
</style>