<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Mfm :text="displayName" :author="user" :plain="true" :nowrap="nowrap" :emojiUrls="user.emojis"/>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import { userName } from '@/filters/user.js';
import { nicknameState } from '@/utility/edit-nickname.js';

const props = withDefaults(defineProps<{
	user: Misskey.entities.User;
	nowrap?: boolean;
}>(), {
	nowrap: true,
});

// ニックネーム設定が変更されたときに自動的に再計算される
const displayName = computed(() => {
	// 依存関係の追跡のためだけに参照
	void nicknameState.map.value;
	void nicknameState.enabled.value;
	return userName(props.user);
});
</script>
