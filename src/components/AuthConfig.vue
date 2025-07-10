<template>
  <div class="auth-config">
    <a-form layout="vertical">
      <a-form-item label="认证类型">
        <a-select :value="auth.type" @change="(value) => updateAuthField('type', value)">
          <a-select-option value="none">无认证</a-select-option>
          <a-select-option value="basic">Basic Auth</a-select-option>
          <a-select-option value="bearer">Bearer Token</a-select-option>
          <a-select-option value="oauth2">OAuth 2.0</a-select-option>
        </a-select>
      </a-form-item>

      <!-- Basic Auth -->
      <template v-if="auth.type === 'basic'">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="用户名">
              <a-input
                :value="auth.basic.username"
                placeholder="输入用户名"
                @change="(e) => updateAuthField('basic.username', e.target.value)"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="密码">
              <a-input-password
                :value="auth.basic.password"
                placeholder="输入密码"
                @change="(e) => updateAuthField('basic.password', e.target.value)"
              />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-alert 
          v-if="basicAuthPreview"
          :message="`Authorization: Basic ${basicAuthPreview}`"
          type="info" 
          show-icon 
          class="auth-preview"
        />
      </template>

      <!-- Bearer Token -->
      <template v-if="auth.type === 'bearer'">
        <a-form-item label="Token">
          <a-input
            :value="auth.bearer.token"
            placeholder="输入Bearer Token"
            @change="(e) => updateAuthField('bearer.token', e.target.value)"
          />
        </a-form-item>
        
        <a-alert 
          v-if="auth.bearer.token"
          :message="`Authorization: Bearer ${auth.bearer.token}`"
          type="info" 
          show-icon 
          class="auth-preview"
        />
      </template>

      <!-- OAuth 2.0 -->
      <template v-if="auth.type === 'oauth2'">
        <a-form-item label="Access Token">
          <a-input
            :value="auth.oauth2.accessToken"
            placeholder="输入Access Token"
            @change="(e) => updateAuthField('oauth2.accessToken', e.target.value)"
          />
        </a-form-item>
        
        <a-form-item>
          <a-button type="primary" @click="handleOAuthFlow">
            获取Token
          </a-button>
          <span class="oauth-hint">点击按钮启动OAuth 2.0授权流程</span>
        </a-form-item>
        
        <a-alert 
          v-if="auth.oauth2.accessToken"
          :message="`Authorization: Bearer ${auth.oauth2.accessToken}`"
          type="info" 
          show-icon 
          class="auth-preview"
        />
      </template>

      <!-- 无认证提示 -->
      <template v-if="auth.type === 'none'">
        <a-empty 
          description="未选择认证方式"
          :image="false"
        />
      </template>
    </a-form>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { message } from 'ant-design-vue'

const props = defineProps({
  auth: {
    type: Object,
    default: () => ({
      type: 'none',
      basic: { username: '', password: '' },
      bearer: { token: '' },
      oauth2: { accessToken: '' }
    })
  }
})

const emit = defineEmits(['update:auth'])

// Basic Auth预览
const basicAuthPreview = computed(() => {
  const { username, password } = props.auth.basic
  if (username || password) {
    return btoa(`${username}:${password}`)
  }
  return ''
})

// 更新认证字段
const updateAuthField = (field, value) => {
  const newAuth = { ...props.auth }

  if (field.includes('.')) {
    const [parent, child] = field.split('.')
    newAuth[parent] = { ...newAuth[parent], [child]: value }
  } else {
    newAuth[field] = value
  }

  emit('update:auth', newAuth)
}

// 认证类型变更处理
const handleAuthTypeChange = () => {
  updateAuth()
}

// 更新认证信息
const updateAuth = () => {
  emit('update:auth', props.auth)
}

// OAuth 2.0流程处理
const handleOAuthFlow = () => {
  message.info('OAuth 2.0授权流程功能待实现')
  // 这里可以实现OAuth 2.0的授权流程
  // 1. 打开授权页面
  // 2. 获取授权码
  // 3. 交换访问令牌
}
</script>

<style scoped>
.auth-config {
  max-width: 600px;
}

.auth-preview {
  margin-top: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

.oauth-hint {
  margin-left: 8px;
  color: #666;
  font-size: 12px;
}

:deep(.ant-empty) {
  margin: 20px 0;
}

/* 深色主题样式 */
[data-theme="dark"] .oauth-hint {
  color: #8c8c8c;
}

[data-theme="dark"] .auth-preview {
  color: #fff;
}
</style>
