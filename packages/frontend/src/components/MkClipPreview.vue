<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" class="_panel">
	<b>{{ clip.name }}</b>
	<div v-if="clip.description" :class="$style.description">{{ clip.description }}</div>
	<div v-if="clip.lastClippedAt">{{ i18n.ts.updatedAt }}: <MkTime :time="clip.lastClippedAt" mode="detail"/></div>
	<div :class="$style.user">
		<MkAvatar :user="clip.user" :class="$style.userAvatar" indicator link preview/> <MkUserName :user="clip.user" :nowrap="false"/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n.js';

defineProps<{
	clip: any;
}>();
</script>

<style lang="scss" module>
.root {
	display: block;
	padding: 16px;
}

.description {
	padding: 8px 0;
}

.user {
	padding-top: 16px;
	border-top: solid 0.5px var(--divider);
}

.userAvatar {
	width: 32px;
	height: 32px;
}
</style>
