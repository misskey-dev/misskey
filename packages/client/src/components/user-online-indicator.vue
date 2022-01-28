<template>
<div v-tooltip="text" class="fzgwjkgc" :class="user.onlineStatus"></div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as misskey from 'misskey-js';
import { i18n } from '@/i18n';

const props = defineProps<{
	user: misskey.entities.User;
}>();

const text = $computed(() => {
	switch (props.user.onlineStatus) {
		case 'online': return i18n.ts.online;
		case 'active': return i18n.ts.active;
		case 'offline': return i18n.ts.offline;
		case 'unknown': return i18n.ts.unknown;
	}
});
</script>

<style lang="scss" scoped>
.fzgwjkgc {
	box-shadow: 0 0 0 3px var(--panel);
	border-radius: 120%; // Blinkのバグか知らんけど、100%ぴったりにすると何故か若干楕円でレンダリングされる

	&.online {
		background: #58d4c9;
	}

	&.active {
		background: #e4bc48;
	}

	&.offline {
		background: #ea5353;
	}

	&.unknown {
		background: #888;
	}
}
</style>
