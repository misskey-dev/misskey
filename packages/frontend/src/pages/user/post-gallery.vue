<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<MkSpacer :contentMax="1100">
		<div :class="$style.root">
			<MkPagination v-slot="{items}" :pagination="pagination">
				<div :class="$style.stream">
					<MkMedias v-for="note in items" :note="note"/>
				</div>
			</MkPagination>
		</div>
	</MkSpacer>
</template>

<script lang="ts" setup>

import MkMedias from "@/components/MkMedias.vue";
import MkPagination from "@/components/MkPagination.vue";
import {computed} from "vue";
import * as Misskey from "misskey-js";

const props = defineProps<{
	user: Misskey.entities.UserDetailed;
}>();

const pagination = {
	endpoint: 'users/notes' as const,
	limit: 10,
	params: computed(() => ({
		userId: props.user.id,
		withFiles: true,
	})),
};
</script>

<style lang="scss" module>
.root {
	padding: 8px;
}

.stream {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
	grid-gap: 6px;
}

@media (min-width: 720px) {
	.stream {
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
	}
}
</style>
