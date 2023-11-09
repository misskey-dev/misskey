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
	<template #header> 予約投稿一覧</template>
	<div v-for="item in notes">
		<MkSpacer :marginMin="14" :marginMax="16">
			<MkNoteSimple scheduled="true" :note="item.note"/>
		</MkSpacer>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import * as os from '@/os.js';
import MkNoteSimple from '@/components/MkNoteSimple.vue';
import MkSignin from '@/components/MkSignin.vue';
const emit = defineEmits<{
	(ev: 'ok', selected: Misskey.entities.UserDetailed): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

let dialogEl = $ref();
const notes = ref([]);
const cancel = () => {
	emit('cancel');
	dialogEl.close();
};

onMounted(async () => {
	notes.value = await os.api('notes/list-schedule');
});

</script>

<style lang="scss" module>
</style>
