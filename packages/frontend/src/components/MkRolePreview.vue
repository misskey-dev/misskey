<template>
<MkA v-adaptive-bg :to="`/admin/roles/${role.id}`" class="_panel" :class="$style.root" tabindex="-1" :style="{ '--color': role.color }">
	<div :class="$style.title">
		<span :class="$style.icon">
			<i v-if="role.isAdministrator" class="ti ti-crown" style="color: var(--accent);"></i>
			<i v-else-if="role.isModerator" class="ti ti-shield" style="color: var(--accent);"></i>
			<i v-else class="ti ti-user" style="opacity: 0.7;"></i>
		</span>
		<span :class="$style.name">{{ role.name }}</span>
		<span v-if="role.target === 'manual'" :class="$style.users">{{ role.usersCount }} users</span>
		<span v-else-if="role.target === 'conditional'" :class="$style.users">({{ i18n.ts._role.conditional }})</span>
	</div>
	<div :class="$style.description">{{ role.description }}</div>
</MkA>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as misskey from 'misskey-js';
import * as os from '@/os';
import { i18n } from '@/i18n';

const props = defineProps<{
	role: any;
}>();
</script>

<style lang="scss" module>
.root {
	display: block;
	padding: 16px 20px;
	border-left: solid 6px var(--color);
}

.title {
	display: flex;
}

.icon {
	margin-right: 8px;
}

.name {
	font-weight: bold;
}

.users {
	margin-left: auto;
	opacity: 0.7;
}

.description {
	opacity: 0.7;
	font-size: 85%;
}
</style>
