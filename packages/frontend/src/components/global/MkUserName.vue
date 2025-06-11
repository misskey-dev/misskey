<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<span class="mk-user-name">
	<Mfm :text="displayName" :author="user" :plain="true" :nowrap="nowrap" :emojiUrls="user.emojis"/>
	<span v-if="hasNickname" class="original-name">
		{{ user.name || user.username }}
	</span>
</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import { userName } from '@/filters/user.js';
import { nicknameState, getNicknameForUser } from '@/utility/edit-nickname.js';

const props = withDefaults(defineProps<{
	user: Misskey.entities.User;
	nowrap?: boolean;
}>(), {
	nowrap: true,
});

// ニックネームが設定されているかチェック
const hasNickname = computed(() => {
	return nicknameState.enabled.value && getNicknameForUser(props.user) !== null;
});

// ニックネーム設定が変更されたときに自動的に再計算される
const displayName = computed(() => {
	// 依存関係の追跡のためだけに参照
	void nicknameState.map.value;
	void nicknameState.enabled.value;
	return userName(props.user);
});
</script>

<style lang="scss" scoped>
.mk-user-name {
	display: inline-flex;
	align-items: center;
	gap: 4px;

	.original-name {
		opacity: 0.7;
	}
}
</style>
