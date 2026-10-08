<template>
  <el-config-provider :locale="zhCn" :z-index="3000">
    <RouterView />
  </el-config-provider>
</template>

<script setup lang="ts">
// 把 Element Plus 的内置文案切成中文（分页、空状态、日期选择器等）。
// 不包这一层，el-table 的空状态会显示英文 "No Data"。
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>
