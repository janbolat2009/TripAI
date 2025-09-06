<template>
  <div class="root-container">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'Root',
};
</script>

<style scoped>
* {
  font-family: 'Arial', sans-serif;
  padding: 0;
  margin: 0;
}

.root-container {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  background-color: #375f57;
  color: #ffffff;
  overflow-x: hidden;
  box-sizing: border-box;
}
</style>