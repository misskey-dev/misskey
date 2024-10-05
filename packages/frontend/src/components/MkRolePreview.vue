<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkA :to="forModeration ? `/admin/roles/${role.id}` : `/roles/${role.id}`" :class="$style.root" tabindex="-1" :style="{ '--color': role.color }">
	<template v-if="forModeration">
		<i v-if="role.isPublic" class="ti ti-world" :class="$style.icon" style="color: var(--success)"></i>
		<i v-else class="ti ti-lock" :class="$style.icon" style="color: var(--warn)"></i>
	</template>

	<div v-adaptive-bg class="_panel" :class="$style.body">
		<div :class="$style.bodyTitle">
			<span :class="$style.bodyIcon">
				<template v-if="role.iconUrl">
					<img :class="$style.bodyBadge" :src="role.iconUrl"/>
				</template>
				<template v-else>
					<i v-if="role.isAdministrator" class="ti ti-crown" style="color: var(--accent);"></i>
					<i v-else-if="role.isModerator" class="ti ti-shield" style="color: var(--accent);"></i>
					<i v-else class="ti ti-user" style="opacity: 0.7;"></i>
				</template>
			</span>
			<span :class="$style.bodyName">{{ role.name }}</span>
			<template v-if="detailed">
				<span v-if="role.target === 'manual'" :class="$style.bodyUsers">{{ role.usersCount }} users</span>
				<span v-else-if="role.target === 'conditional'" :class="$style.bodyUsers">? users</span>
			</template>
		</div>
		<div :class="$style.bodyDescription">{{ role.description }}</div>
	</div>
</MkA>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';

const props = withDefaults(defineProps<{
	role: Misskey.entities.Role;
	forModeration: boolean;
	detailed: boolean;
}>(), {
	detailed: true,
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	align-items: center;
}

.icon {
	margin: 0 12px;
}

.body {
	display: block;
	padding: 16px 20px;
	flex: 1;
	border-left: solid 6px var(--color);
}

.bodyTitle {
	display: flex;
}

.bodyIcon {
	margin-right: 8px;
}

.bodyBadge {
	height: 1.3em;
	vertical-align: -20%;
}

.bodyName {
	font-weight: bold;
}

.bodyUsers {
	margin-left: auto;
	opacity: 0.7;
}

.bodyDescription {
	opacity: 0.7;
	font-size: 85%;
}
</style>
