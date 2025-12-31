<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<MkA :to="userPage(item.user)" style="overflow: clip;">
		<MkUserCardMini :user="item.user" :withChart="false" style="text-overflow: ellipsis; background: inherit; border-radius: unset;"/>
	</MkA>
	<button v-tooltip.noDelay="i18n.ts.note" class="_button" :class="$style.post" @click="os.post({initialText: `@${item.user.username}${item.user.host ? `@${item.user.host}` : ''} `})">
		<i class="ti-fw ti ti-confetti" :class="$style.postIcon"></i>
	</button>
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
	box-sizing: border-box;
	display: grid;
	align-items: center;
	grid-template-columns: auto 56px;
}

.post {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 40px;
	width: 40px;
	margin-right: 16px;
	aspect-ratio: 1/1;
	border-radius: 100%;
	background: linear-gradient(90deg, var(--MI_THEME-buttonGradateA), var(--MI_THEME-buttonGradateB));

	&:hover {
		background: linear-gradient(90deg, hsl(from var(--MI_THEME-accent) h s calc(l + 5)), hsl(from var(--MI_THEME-accent) h s calc(l + 5)));
	}
}

.postIcon {
	color: var(--MI_THEME-fgOnAccent);
}
</style>
