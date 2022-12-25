<template>
<div class="mk-notification-toast" :style="{ zIndex }">
	<transition :name="$store.state.animation ? 'notification-toast' : ''" appear @after-leave="$emit('closed')">
		<XNotification v-if="showing" :notification="notification" class="notification _acrylic"/>
	</transition>
</div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import XNotification from '@/components/MkNotification.vue';
import * as os from '@/os';

defineProps<{
	notification: any; // TODO
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const zIndex = os.claimZIndex('high');
let showing = $ref(true);

onMounted(() => {
	window.setTimeout(() => {
		showing = false;
	}, 6000);
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
		bottom: calc(env(safe-area-inset-bottom, 0px) + 92px);
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
