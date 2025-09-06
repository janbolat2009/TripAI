<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content" :class="{ 'fade-in': show }">
      <button class="close-btn" @click="$emit('close')">&times;</button>
      <h2 class="modal-title">Профиль</h2>
      <div class="profile-info">
        <div class="profile-field">
          <span class="label">Имя:</span>
          <span class="value">{{ user.name || 'Не указано' }}</span>
        </div>
        <div class="profile-field">
          <span class="label">Email:</span>
          <span class="value">{{ user.email || 'Не указано' }}</span>
        </div>
      </div>
      <button class="logout-btn" @click="logout">
        <span>Выйти</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    user: {
      type: Object,
      required: true,
    },
  },
  methods: {
    logout() {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      this.$emit('logout');
      this.$emit('close');
      alert('Вы вышли из аккаунта');
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
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
  transition: backdrop-filter 0.3s ease;
}

.modal-content {
  position: relative;
  background: linear-gradient(135deg, #2d544d, #1e3d36);
  padding: 40px 30px 30px;
  border-radius: 15px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 15px rgba(67, 181, 129, 0.2);
  color: #e0f2e9;
  opacity: 0;
  transform: scale(0.9) translateY(20px);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
}

.modal-content.fade-in {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.modal-title {
  margin-bottom: 25px;
  font-size: 28px;
  text-align: center;
  font-weight: 700;
  color: #a3d9b1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  animation: pulse 1.5s infinite alternate;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 25px;
  justify-content: center;
  background: rgba(30, 61, 54, 0.8);
  padding: 20px;
  border-radius: 10px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
}

.profile-field {
  display: flex;
  justify-content: space-between;
  padding: 12px 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.profile-field:hover {
  transform: translateX(8px);
  box-shadow: 0 4px 12px rgba(67, 181, 129, 0.3);
}

.label {
  font-weight: 600;
  color: #a3d9b1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  color: #e0f2e9;
  font-size: 1.1rem;
  transition: color 0.3s ease;
}

.profile-field:hover .value {
  color: #c1e7d2;
}

.logout-btn {
  width: 100%;
  max-width: 400px;
  padding: 14px;
  background: linear-gradient(90deg, #ff6b6b, #e63946);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.4s ease;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-btn:hover {
  background: linear-gradient(90deg, #e63946, #ff6b6b);
  transform: scale(1.05) rotate(2deg);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.logout-btn span {
  position: relative;
  z-index: 2;
}

.logout-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
}

.logout-btn:hover::after {
  width: 300px;
  height: 300px;
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
  transition: all 0.3s ease;
  padding: 5px;
  border-radius: 50%;
}

.close-btn:hover {
  color: #fff;
  background: rgba(163, 217, 177, 0.2);
  transform: rotate(180deg) scale(1.2);
}

@keyframes pulse {
  from {
    transform: scale(1);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  to {
    transform: scale(1.02);
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
  }
}

@media (max-width: 480px) {
  .modal-content {
    max-width: 90%;
    padding: 25px 20px;
  }

  .modal-title {
    font-size: 24px;
  }

  .profile-field {
    padding: 8px 10px;
  }

  .logout-btn {
    padding: 10px;
    font-size: 14px;
  }
}
</style>