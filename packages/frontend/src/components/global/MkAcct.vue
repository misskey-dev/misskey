<template>
<MkCondensedLine v-if="defaultStore.state.enableCondensedLineForAcct" :minScale="2 / 3">
	<span>@{{ user.username }}</span>
	<span v-if="user.host || detail || defaultStore.state.showFullAcct" style="opacity: 0.5;">@{{ user.host || host }}</span>
</MkCondensedLine>
<span v-else>
	<span>@{{ user.username }}</span>
	<span v-if="user.host || detail || defaultStore.state.showFullAcct" style="opacity: 0.5;">@{{ user.host || host }}</span>
</span>
</template>

<script lang="ts" setup>
import * as misskey from 'misskey-js';
import { toUnicode } from 'punycode/';
import MkCondensedLine from './MkCondensedLine.vue';
import { host as hostRaw } from '@/config';
import { defaultStore } from '@/store';

defineProps<{
	user: misskey.entities.UserDetailed;
	detail?: boolean;
}>();

const host = toUnicode(hostRaw);
</script>
