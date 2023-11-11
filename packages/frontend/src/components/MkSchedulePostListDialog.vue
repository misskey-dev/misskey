<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialogEl"
	:withOkButton="false"
	@click="cancel()"
	@close="cancel()"
	@closed="$emit('closed')"
>
	<template #header>{{ i18n.ts._schedulePost.list }}</template>
	<MkSpacer :marginMin="14" :marginMax="16">
		<MkPagination :pagination="pagination">
			<template #empty>
				<div class="_fullinfo">
					<img :src="infoImageUrl" class="_ghost"/>
					<div>{{ i18n.ts.nothing }}</div>
				</div>
			</template>

			<template #default="{ items }">
				<div class="_gaps">
					<MkNoteSimple v-for="item in items" :key="item.id" :scheduled="true" :note="item.note"/>
				</div>
			</template>
		</MkPagination>
	</MkSpacer>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import type { Paging } from '@/components/MkPagination.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkNoteSimple from '@/components/MkNoteSimple.vue';
import { i18n } from '@/i18n.js';
import { infoImageUrl } from '@/instance.js';

const emit = defineEmits<{
	(ev: 'ok', selected: Misskey.entities.UserDetailed): void;
	(ev: 'cancel'): void;
	(ev: 'c-losed'): void;
}>();

const dialogEl = ref();
const cancel = () => {
	emit('cancel');
	dialogEl.value.close();
};

const pagination: Paging = {
	endpoint: 'notes/schedule/list',
	limit: 10,
};
</script>

<style lang="scss" module>
</style>
