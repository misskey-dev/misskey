<template>
<div class="mk-notification-toast" :style="{ zIndex }">
	<transition name="notification-toast" appear @after-leave="$emit('closed')">
		<XNotification v-if="showing" :notification="notification" class="notification _acrylic"/>
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
	emits: ['closed'],
	data() {
		return {
			showing: true,
			zIndex: os.claimZIndex('high'),
		};
	},
	mounted() {
		setTimeout(() => {
			this.showing = false;
		}, 6000);
	}
});
</script>

<style lang="scss" scoped>
.notification-toast-enter-active, .notification-toast-leave-active {
	transition: opacity 0.3s, transform 0.3s !important;
}
.notification-toast-enter-from, .notification-toast-leave-to {
	opacity: 0;
	transform: translateX(-250px);
}

.mk-notification-toast {
	position: fixed;
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
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
		border-radius: 8px;
		overflow: hidden;
	}
}
</style>
