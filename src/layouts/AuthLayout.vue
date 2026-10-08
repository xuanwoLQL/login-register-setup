<template>
  <div class="auth-layout">
    <!-- 左侧品牌区：纯 CSS 装饰（渐变 + 两团径向光斑），不引入图片资源 -->
    <aside class="auth-brand">
      <span class="blob blob-1"></span>
      <span class="blob blob-2"></span>
      <div class="brand-inner">
        <div class="brand-logo">◆</div>
        <h1 class="brand-title">软件设计与开发</h1>
        <p class="brand-slogan">「把 Vue 学明白」</p>
        <ul class="brand-points">
          <li>· 前后端交互全流程</li>
          <li>· 路由守卫与前端鉴权</li>
          <li>· 网络层 Mock 数据</li>
        </ul>
      </div>
    </aside>

    <!-- 右侧表单区：/login 与 /register 是 AuthLayout 的子路由，
         子路由组件通过 <RouterView /> 渲染进来
         （设计文档 §8.1 写的"<slot />"是设计当时的表述；嵌套路由必须用 RouterView，
          见知识点对照表 #7） -->
    <main class="auth-main">
      <div class="auth-card">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.auth-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background-color: $bg-page;
}

/* ---------- 左侧品牌区 ---------- */
.auth-brand {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: #fff;
  background: linear-gradient(135deg, $brand 0%, $brand-dark 100%);
}

/* 两团径向光斑（纯 CSS 装饰） */
.blob {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, transparent 70%);
  pointer-events: none;
}

.blob-1 {
  width: 420px;
  height: 420px;
  top: -120px;
  right: -80px;
}

.blob-2 {
  width: 360px;
  height: 360px;
  bottom: -110px;
  left: -70px;
}

.brand-inner {
  position: relative;
  z-index: 1;
  padding: 2rem;
  max-width: 420px;
}

.brand-logo {
  font-size: 42px;
  line-height: 1;
  margin-bottom: 18px;
  opacity: 0.9;
}

.brand-title {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 2px;
  margin-bottom: 10px;
}

.brand-slogan {
  font-size: 16px;
  opacity: 0.85;
  margin-bottom: 36px;
}

.brand-points {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 15px;
  opacity: 0.92;
}

/* ---------- 右侧表单区（固定 480px） ---------- */
.auth-main {
  flex-shrink: 0;
  width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: $bg-page;
}

.auth-card {
  width: 100%;
  background-color: $bg-card;
  border: 1px solid $border;
  border-radius: $radius;
  box-shadow: 0 8px 30px rgba(31, 36, 48, 0.08);
  padding: 2.5rem 2.25rem;
}

/* 窄屏 (< 900px)：隐藏左侧品牌区，右侧卡片居中并占满宽度 */
@media (max-width: 899px) {
  .auth-brand {
    display: none;
  }

  .auth-main {
    width: 100%;
    padding: 1rem;
  }

  .auth-card {
    padding: 2rem 1.5rem;
  }
}
</style>
