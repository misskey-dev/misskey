<template>
<div class="bg-pattern" :class="status">
	<main>
		<div class="card">
			<div class="icon-container">
				<Icon :icon="icon"></Icon>
			</div>

			<h1>{{ titleText }}</h1>

			<div class="content">
				<p v-for="(line, index) in contentLines" :key="index">
					{{ line }}
				</p>
			</div>

			<a :href="buttonHref" class="button">
				{{ buttonText }}
			</a>
		</div>
	</main>

	<div class="decoration top-left"></div>
	<div class="decoration bottom-right"></div>
</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps<{
	code?: string;
}>();

const status = ref('pending');
const content = ref('');

const verifyEmail = async (code: string) => {
	try {
		const response = await fetch(`/api/verify-email/${code}`);
		const data = await response.json();

		if (data.status === 'success') {
			status.value = 'success';
			content.value = '验证成功！';
		} else if (data.status === 'error') {
			status.value = 'failure';
			content.value = data.message || '验证失败！';
		} else {
			status.value = 'failure';
			content.value = '未知错误，请稍后重试。';
		}
	} catch (error) {
		status.value = 'failure';
		content.value = '验证过程中发生错误，请稍后重试。';
	}
};

onMounted(() => {
	if (props.code) {
		verifyEmail(props.code);
	} else {
		status.value = 'failure';
		content.value = '无效的验证码。';
	}
});

const icon = computed(() => status.value === 'success' ? 'mingcute:check-fill' : 'mingcute:close-fill');
const titleText = computed(() => status.value === 'success' ? 'VERIFICATION SUCCESS' : 'VERIFICATION FAILED');
const buttonText = computed(() => status.value === 'success' ? '返回首页' : '重新尝试');
const buttonHref = computed(() => status.value === 'success' ? '/' : '/resend-verification');
const contentLines = computed(() => content.value.split('\n'));
</script>

<style scoped>
.bg-pattern {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 1rem;
	background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFDD88' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
	transition: background-color 0.3s ease;
	position: fixed;
	width: 100%;
	height: 100%;
	overflow: hidden;
}

.bg-pattern.success {
	background-color: #77DD77;
	background-image: linear-gradient(to bottom right, #77DD77, #77BBDD);
}

.bg-pattern.failure {
	background-color: #FF8899;
	background-image: linear-gradient(to bottom right, #FF8899, #7777AA);
}

.dark .bg-pattern {
	background-color: #1a1a1a;
	background-image: linear-gradient(to bottom right, #2a2a2a, #1a1a1a);
}

main {
	width: 100%;
	max-width: 28rem;
}

.card {
	background-color: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(10px);
	border-radius: 1.5rem;
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	padding: 2rem;
	transition: all 0.3s;
	transform: translateY(0);
}

.dark .card {
	background-color: rgba(30, 30, 30, 0.95);
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.card:hover {
	box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.3);
	transform: translateY(-0.25rem);
}

.icon-container {
	width: 6rem;
	height: 6rem;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 2rem;
	font-size: 2.5rem;
	color: white;
	box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
	animation: icon-appear 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}

.success .icon-container {
	background-color: #77DD77;
}

.failure .icon-container {
	background-color: #FF8899;
}

h1 {
	font-size: 1.875rem;
	font-weight: bold;
	text-align: center;
	margin-bottom: 1.5rem;
	letter-spacing: 0.05em;
}

.success h1 {
	color: #77DD77;
}

.failure h1 {
	color: #FF8899;
}

.dark h1 {
	color: #ffffff;
}

.content {
	margin-bottom: 2.5rem;
	max-height: 60vh;
	overflow-y: auto;
}

.content p {
	font-size: 0.875rem;
	line-height: 1.5;
	text-align: center;
	color: #4B5563;
	margin-bottom: 0.75rem;
}

.dark .content p {
	color: #D1D5DB;
}

.button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	max-width: 200px;
	margin: 0 auto;
	padding: 0.75rem 1.5rem;
	border-radius: 9999px;
	font-weight: 600;
	font-size: 1rem;
	text-align: center;
	color: white;
	transition: all 0.3s;
	border: none;
	cursor: pointer;
}

.success .button {
	background-color: #77DD77;
}

.failure .button {
	background-color: #FF8899;
}

.dark .success .button {
	background-color: #5BBD5B;
}

.dark .failure .button {
	background-color: #E06677;
}

.button:hover {
	opacity: 0.9;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	transform: scale(0.98);
}

.button:active {
	transform: scale(0.95);
}

.button:focus {
	outline: none;
	box-shadow: 0 0 0 3px rgba(255, 221, 136, 0.5);
}

.decoration {
	position: fixed;
	border-radius: 50%;
	opacity: 0.2;
}

.top-left {
	top: 1rem;
	left: 1rem;
	width: 4rem;
	height: 4rem;
	background-color: #FFDD88;
}

.bottom-right {
	bottom: 1rem;
	right: 1rem;
	width: 6rem;
	height: 6rem;
}

.success .bottom-right {
	background-color: #77BBDD;
}

.failure .bottom-right {
	background-color: #7777AA;
}

@keyframes icon-appear {
	0% {
		transform: scale(0);
		opacity: 0;
	}

	80% {
		transform: scale(1.1);
	}

	100% {
		transform: scale(1);
		opacity: 1;
	}
}

@media (min-width: 768px) {
	.content p {
		font-size: 1rem;
	}

	.button {
		font-size: 1.125rem;
	}
}

@media (max-width: 640px) {
	.card {
		padding: 1.5rem;
		min-height: 90vh;
	}

	h1 {
		font-size: 1.5rem;
	}

	.button {
		font-size: 0.875rem;
	}
}

@media (max-height: 640px) {
	.content {
		max-height: 50vh;
	}
}
</style>

<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');

html,
body {
	overflow: hidden !important;
	width: 100%;
	height: 100%;
	margin: 0;
	padding: 0;
	font-family: 'Poppins', sans-serif;
}

.header,
.side,
.ui-universal-sidebar,
.ui-universal-widgets {
	display: none !important;
}
</style>
