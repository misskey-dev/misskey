<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="note == null || note.deletedAt"></div>
<MkAvatar v-else :user="note.user" :indicator="indicator" :link="link" :preview="preview"/>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';

withDefaults(defineProps<{
	note: Misskey.entities.Note | null;
	indicator?: boolean;
	link?: boolean;
	preview?: boolean;
}>(), {
	indicator: false,
	link: false,
	preview: false,
});
</script>
