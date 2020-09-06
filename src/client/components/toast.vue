<template>
<div class="mk-toast">
	<transition name="notification-slide" appear @after-leave="() => { destroyDom(); }">
		<x-notification :notification="notification" class="notification" v-if="show"/>
	</transition>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XNotification from './notification.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XNotification
	},
	props: {
		notification: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			show: true
		};
	},
	mounted() {
		setTimeout(() => {
			this.show = false;
		}, 6000);
	}
});
</script>

<style lang="scss" scoped>
.notification-slide-enter-active, .notification-slide-leave-active {
	transition: opacity 0.3s, transform 0.3s !important;
}
.notification-slide-enter, .notification-slide-leave-to {
	opacity: 0;
	transform: translateX(-250px);
}

.mk-toast {
	position: fixed;
	z-index: 10000;
	left: 0;
	width: 250px;
	top: 32px;
	padding: 0 32px;
	pointer-events: none;

	@media (max-width: 700px) {
		top: initial;
		bottom: 112px;
		padding: 0 16px;
	}

	@media (max-width: 500px) {
		bottom: 92px;
		padding: 0 8px;
	}

	> .notification {
		height: 100%;
		-webkit-backdrop-filter: blur(12px);
		backdrop-filter: blur(12px);
		background-color: var(--toastBg);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
		border-radius: 8px;
		color: var(--toastFg);
		overflow: hidden;
	}
}
</style>
