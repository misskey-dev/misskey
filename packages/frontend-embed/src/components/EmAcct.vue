<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<span>
	<span>@{{ user.username }}</span>
	<span v-if="user.host || detail" style="opacity: 0.5;">@{{ user.host || host }}</span>
</span>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { toUnicode } from 'punycode/';
import { host as hostRaw } from '@@/js/config.js';

defineProps<{
	user: Misskey.entities.UserLite;
	detail?: boolean;
}>();

const host = toUnicode(hostRaw);
</script>
