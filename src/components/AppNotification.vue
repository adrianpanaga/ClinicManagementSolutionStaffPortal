<template>
  <div v-if="notification.message" :class="['notification', notification.type]">
    <div class="notification-content">
      <span class="message">{{ notification.message }}</span>
      <button @click="hide" class="close-btn">&times;</button>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';

const notification = reactive({
  message: '',
  type: '',
  timeout: null,
});

const show = (message, type = 'info', duration = 3000) => {
  if (notification.timeout) {
    clearTimeout(notification.timeout);
  }
  notification.message = message;
  notification.type = type;
  notification.timeout = setTimeout(() => {
    hide();
  }, duration);
};

const hide = () => {
  notification.message = '';
  notification.type = '';
};

defineExpose({
  show,
});
</script>

<style scoped lang="scss">
@import '../assets/styles/_variables.scss';

.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  color: #fff;
  z-index: 1000;
  min-width: 250px;
  max-width: 400px;
  animation: fadeIn 0.3s ease-out forwards;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &.success {
    background-color: $color-confirm-green;
  }
  &.error {
    background-color: $color-error;
  }
  &.info {
    background-color: $color-info;
  }

  .notification-content {
    display: flex;
    align-items: center;
    width: 100%;
  }

  .message {
    flex-grow: 1;
    font-weight: 500;
  }

  .close-btn {
    background: none;
    border: none;
    color: #fff;
    font-size: 1.5rem;
    cursor: pointer;
    margin-left: 10px;
    line-height: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>