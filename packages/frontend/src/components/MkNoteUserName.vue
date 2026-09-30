<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<span v-if="note == null || note.deletedAt" style="opacity: 0.5;">
	Unknown User
</span>
<MkA v-else-if="link" v-user-preview="note.userId" :to="userPage(note.user)">
	<MkUserName :user="note.user" :nowrap="nowrap"/>
</MkA>
<span v-else>
	<MkUserName :user="note.user" :nowrap="nowrap"/>
</span>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { userPage } from '@/filters/user.js';

withDefaults(defineProps<{
	note: Misskey.entities.Note | null;
	link?: boolean;
	nowrap?: boolean;
}>(), {
	link: true,
	nowrap: true,
});
</script>
