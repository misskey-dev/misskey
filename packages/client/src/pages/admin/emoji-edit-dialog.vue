<template>
<XModalWindow ref="dialog"
	:width="370"
	:with-ok-button="true"
	@close="$refs.dialog.close()"
	@closed="$emit('closed')"
	@ok="ok()"
>
	<template #header>:{{ emoji.name }}:</template>

	<div class="_monolithic_">
		<div class="yigymqpb _section">
			<img :src="emoji.url" class="img"/>
			<MkInput v-model="name" class="_formBlock">
				<template #label>{{ $ts.name }}</template>
			</MkInput>
			<MkInput v-model="category" class="_formBlock" :datalist="categories">
				<template #label>{{ $ts.category }}</template>
			</MkInput>
			<MkInput v-model="aliases" class="_formBlock">
				<template #label>{{ $ts.tags }}</template>
				<template #caption>{{ $ts.setMultipleBySeparatingWithSpace }}</template>
			</MkInput>
			<MkButton danger @click="del()"><i class="fas fa-trash-alt"></i> {{ $ts.delete }}</MkButton>
		</div>
	</div>
</XModalWindow>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XModalWindow from '@/components/ui/modal-window.vue';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/form/input.vue';
import * as os from '@/os';
import { unique } from '@/scripts/array';
import { i18n } from '@/i18n';
import { emojiCategories } from '@/instance';

const props = defineProps<{
	emoji: any,
}>();

let dialog = $ref(null);
let name: string = $ref(props.emoji.name);
let category: string = $ref(props.emoji.category);
let aliases: string = $ref(props.emoji.aliases.join(' '));
let categories: string[] = $ref(emojiCategories);

const emit = defineEmits<{
	(ev: 'done', v: { deleted?: boolean, updated?: any }): void,
	(ev: 'closed'): void
}>();

function ok() {
	update();
}

async function update() {
	await os.apiWithDialog('admin/emoji/update', {
		id: props.emoji.id,
		name,
		category,
		aliases: aliases.split(' '),
	});

	emit('done', {
		updated: {
			id: props.emoji.id,
			name,
			category,
			aliases: aliases.split(' '),
		}
	});

	dialog.close();
}

async function del() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.t('removeAreYouSure', { x: name }),
	});
	if (canceled) return;

	os.api('admin/emoji/delete', {
		id: props.emoji.id
	}).then(() => {
		emit('done', {
			deleted: true
		});
		dialog.close();
	});
}
</script>

<style lang="scss" scoped>
.yigymqpb {
	> .img {
		display: block;
		height: 64px;
		margin: 0 auto;
	}
}
</style>
