<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 1100px;">
	<div :class="$style.root">
		<MkPagination v-slot="{items}" :paginator="paginator" withControl>
			<div :class="$style.stream">
				<MkNoteMediaGrid v-for="note in items" :note="note" square/>
			</div>
		</MkPagination>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import MkNoteMediaGrid from '@/components/MkNoteMediaGrid.vue';
import MkPagination from '@/components/MkPagination.vue';
import { Paginator } from '@/utility/paginator.js';

const props = defineProps<{
	user: Misskey.entities.UserDetailed;
}>();

const paginator = markRaw(new Paginator('users/notes', {
	limit: 15,
	computedParams: computed(() => ({
		userId: props.user.id,
		withFiles: true,
	})),
}));
</script>

<style lang="scss" module>
.root {
	padding: 8px;
}

.stream {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
	gap: var(--MI-marginHalf);
}

@media screen and (min-width: 600px) {
	.stream {
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
	}

}
</style>
