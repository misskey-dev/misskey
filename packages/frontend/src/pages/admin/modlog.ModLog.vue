<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder>
	<template #label>{{ log.type }}</template>
	<template #icon>
		<MkAvatar :user="log.user" :class="$style.avatar"/>
	</template>
	<template #suffix>
		<MkTime :time="log.createdAt" mode="detail"/>
	</template>

	<div :class="$style.root">
		<div>{{ i18n.ts.user }}: {{ log.userId }}</div>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { dateString } from '@/filters/date.js';
import MkFolder from '@/components/MkFolder.vue';

const props = defineProps<{
	log: Misskey.entities.ModerationLog;
}>();
</script>

<style lang="scss" module>
.root {
}

.avatar {
	width: 18px;
	height: 18px;
}
</style>
