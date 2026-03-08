<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<span>
	<span>@{{ acct.username }}</span>
	<span v-if="acct.host || detail" style="opacity: 0.5;">@{{ acct.host || host }}</span>
</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import { toUnicode } from 'punycode.js';
import { host as hostRaw } from '@@/js/config.js';

const props = defineProps<{
	user: Misskey.entities.UserLite;
	detail?: boolean;
}>();

const host = toUnicode(hostRaw);
const acct = computed(() => {
	return Misskey.acct.fromUser(props.user);
});

</script>
