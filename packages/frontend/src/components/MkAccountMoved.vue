<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="user" :class="$style.root">
	<i class="ti ti-plane-departure" style="margin-right: 8px;"></i>
	<span v-if="movedTo">{{ i18n.ts.accountMoved }}</span>
	<span v-if="movedFrom">{{ i18n.ts.accountMovedFrom }}</span>
	<MkMention :class="$style.link" :username="user.username" :host="user.host ?? localHost"/>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkMention from './MkMention.vue';
import { i18n } from '@/i18n.js';
import { host as localHost } from '@/config.js';
import { misskeyApi } from '@/scripts/misskey-api.js';

const user = ref<Misskey.entities.UserLite>();

const props = defineProps<{
	movedTo?: string; // user id
	movedFrom?: string; // user id
}>();

if (props.movedTo || props.movedFrom) {
	misskeyApi('users/show', {
		userId: props.movedTo ?? props.movedFrom
	}).then(u => user.value = u);
}
</script>

<style lang="scss" module>
.root {
	padding: 16px;
	font-size: 90%;
	background: var(--infoWarnBg);
	color: var(--error);
	border-radius: var(--radius);
}

.link {
	margin-left: 4px;
}
</style>
