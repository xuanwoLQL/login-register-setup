<template>
  <div class="login-view">
    <h2 class="form-title">欢迎回来</h2>
    <p class="form-subtitle">请登录你的账号</p>

    <!-- 测试账号提示条：学生不用翻 README 就能登录 -->
    <el-alert
      class="test-tip"
      title="测试账号：admin / 123456"
      type="info"
      :closable="false"
      show-icon />

    <el-form ref="formRef" :model="form" :rules="rules" size="large" @submit.prevent="onSubmit">
      <el-form-item prop="username">
        <el-input
          v-model="form.username"
          placeholder="请输入用户名"
          :prefix-icon="User"
          clearable />
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="form.password"
          type="password"
          placeholder="请输入密码"
          :prefix-icon="Lock"
          show-password
          clearable />
      </el-form-item>

      <div class="form-options">
        <el-checkbox v-model="remember">记住我</el-checkbox>
      </div>

      <el-form-item>
        <el-button class="submit-btn" type="primary" native-type="submit" :loading="submitting">
          登 录
        </el-button>
      </el-form-item>
    </el-form>

    <p class="form-footer">
      还没有账号？
      <RouterLink to="/register">立即注册</RouterLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Lock, User } from '@element-plus/icons-vue'
import { login } from '@/api/user'
import { setAuth } from '@/utils/auth'
import type { LoginForm } from '@/types/user'

const route = useRoute()
const router = useRouter()

const formRef = ref<FormInstance>()
const form = reactive<LoginForm>({ username: '', password: '' })
const remember = ref(true)
const submitting = ref(false)

// el-form 的 rules 走 Element Plus 内置的 async-validator
const rules: FormRules<LoginForm> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 16, message: '用户名需 3 ~ 16 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { pattern: /^\S{6,20}$/, message: '密码需 6 ~ 20 位且不含空格', trigger: 'blur' }
  ]
}

// 注册成功后跳转回来，自动回填用户名
onMounted(() => {
  const username = route.query.username
  if (typeof username === 'string' && username) {
    form.username = username
  }
})

async function onSubmit() {
  const ok = await formRef.value?.validate().catch(() => false) // 校验不过会 reject
  if (!ok) return

  submitting.value = true
  try {
    const res = await login({ ...form })
    setAuth(res.token, res.user, remember.value)
    ElMessage.success('登录成功')
    // 优先回到用户原本想去的页面（守卫里存的 redirect），否则去首页
    const redirect = (route.query.redirect as string) || '/home'
    router.replace(redirect) // replace 而不是 push：避免"后退"又回到登录页
  } catch {
    // 错误提示已由响应拦截器统一弹出
  } finally {
    submitting.value = false // 成功跳走了也要复位，防止返回时按钮还是 loading
  }
}
</script>

<style lang="scss" scoped>
.form-title {
  font-size: 24px;
  font-weight: 600;
  color: $text;
  margin-bottom: 6px;
}

.form-subtitle {
  font-size: 14px;
  color: $text-muted;
  margin-bottom: 20px;
}

.test-tip {
  margin-bottom: 20px;
}

.form-options {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 6px;
}

.submit-btn {
  width: 100%;
}

.form-footer {
  margin-top: 4px;
  font-size: 14px;
  color: $text-muted;
  text-align: center;

  a {
    color: $brand;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
