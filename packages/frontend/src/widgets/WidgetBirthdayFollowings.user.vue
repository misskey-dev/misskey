<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkA :to="userPage(item.user)" style="overflow: hidden;">
		<MkUserCardMini :user="item.user" :withChart="false" style="text-overflow: ellipsis; background: inherit; border-radius: unset;"/>
	</MkA>
	<div style="display: flex; margin-right: 16px;">
		<button v-tooltip.noDelay="i18n.ts.note" class="_button" :class="$style.post" @click="os.post({initialText: `@${item.user.username}${item.user.host ? `@${item.user.host}` : ''} `})">
			<i class="ti-fw ti ti-confetti" :class="$style.postIcon"></i>
		</button>
	</div>
</div>
</template>

<script setup lang="ts">
import * as Misskey from 'misskey-js';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { userPage } from '@/filters/user.js';

defineProps<{
	item: Misskey.entities.UsersGetFollowingBirthdayUsersResponse[number];
}>();
</script>

<style lang="scss" module>
.root {
	display: grid;
	grid-template-columns: auto 56px;
	gap: 8px;
}

.post {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 40px;
	margin: auto;
	aspect-ratio: 1/1;
	border-radius: 100%;
	background: linear-gradient(90deg, var(--buttonGradateA), var(--buttonGradateB));

	&:hover, &.active {
		&:before {
			background: var(--accentLighten);
		}
	}
}

.postIcon {
	color: var(--fgOnAccent);
}
</style>
