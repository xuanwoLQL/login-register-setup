<template>
  <div class="register-view">
    <h2 class="form-title">创建账号</h2>
    <p class="form-subtitle">注册一个账号，开始体验</p>

    <el-form ref="formRef" :model="form" :rules="rules" size="large" @submit.prevent="onSubmit">
      <el-form-item prop="username">
        <el-input
          v-model="form.username"
          placeholder="请输入用户名（3 ~ 16 个字符）"
          :prefix-icon="User"
          clearable />
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="form.password"
          type="password"
          placeholder="请输入密码（6 ~ 20 位，不含空格）"
          :prefix-icon="Lock"
          show-password
          clearable />
      </el-form-item>

      <el-form-item prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          placeholder="请再次输入密码"
          :prefix-icon="Lock"
          show-password
          clearable />
      </el-form-item>

      <el-form-item prop="nickname">
        <el-input
          v-model="form.nickname"
          placeholder="请输入昵称"
          :prefix-icon="Avatar"
          clearable />
      </el-form-item>

      <el-form-item prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" :prefix-icon="Message" clearable />
      </el-form-item>

      <el-form-item>
        <el-button class="submit-btn" type="primary" native-type="submit" :loading="submitting">
          注 册
        </el-button>
      </el-form-item>
    </el-form>

    <p class="form-footer">
      已有账号？
      <RouterLink to="/login">去登录</RouterLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Avatar, Lock, Message, User } from '@element-plus/icons-vue'
import { register } from '@/api/user'
import type { RegisterForm, RegisterPayload } from '@/types/user'

const router = useRouter()

const formRef = ref<FormInstance>()
const form = reactive<RegisterForm>({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  email: ''
})
const submitting = ref(false)

// 自定义校验器：确认密码必须与密码一致
const confirmValidator = (_rule: unknown, value: string, callback: (e?: Error) => void) => {
  if (value !== form.password) callback(new Error('两次输入的密码不一致'))
  else callback()
}

const rules: FormRules<RegisterForm> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 16, message: '用户名需 3 ~ 16 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { pattern: /^\S{6,20}$/, message: '密码需 6 ~ 20 位且不含空格', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: confirmValidator, trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称需 2 ~ 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ]
}

// 跨字段联动：用户先填确认密码、再改密码时，
// 确认框的错误提示不会自动消失，需要在密码变化时手动重校验
watch(
  () => form.password,
  () => {
    formRef.value?.validateField('confirmPassword').catch(() => {})
  }
)

async function onSubmit() {
  const ok = await formRef.value?.validate().catch(() => false) // 校验不过会 reject
  if (!ok) return

  submitting.value = true
  try {
    // 表单模型 ≠ 提交模型：去掉纯前端字段 confirmPassword
    const payload: RegisterPayload = {
      username: form.username,
      password: form.password,
      nickname: form.nickname,
      email: form.email
    }
    await register(payload)
    ElMessage.success('注册成功，请登录')
    // 带着用户名跳回登录页，登录页自动回填，形成交互闭环
    router.push({ name: 'login', query: { username: form.username } })
  } catch {
    // 错误提示已由响应拦截器统一弹出（如 409 用户名已被占用）
  } finally {
    submitting.value = false
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
