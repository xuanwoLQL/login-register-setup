<template>
  <div class="not-found">
    <div class="nf-code">404</div>
    <p class="nf-text">页面不存在，请检查地址是否正确</p>
    <el-button type="primary" @click="goHome">返回首页</el-button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.replace('/')
}
</script>

<style lang="scss" scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background-color: $bg-page;
}

.nf-code {
  font-size: 88px;
  font-weight: 700;
  color: $brand;
  line-height: 1;
}

.nf-text {
  font-size: 16px;
  color: $text-muted;
}
</style>
