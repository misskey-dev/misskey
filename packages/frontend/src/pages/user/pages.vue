<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 700px;">
	<MkPagination v-slot="{items}" :paginator="paginator" withControl>
		<MkPagePreview v-for="page in items" :key="page.id" :page="page" class="_margin"/>
	</MkPagination>
</div>
</template>

<script lang="ts" setup>
import { computed, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import MkPagePreview from '@/components/MkPagePreview.vue';
import MkPagination from '@/components/MkPagination.vue';
import { Paginator } from '@/utility/paginator.js';

const props = defineProps<{
	user: Misskey.entities.User;
}>();

const paginator = markRaw(new Paginator('users/pages', {
	limit: 20,
	computedParams: computed(() => ({
		userId: props.user.id,
	})),
}));
</script>
