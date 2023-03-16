<template>
<MkModalWindow
	ref="dialog"
	:width="370"
	:with-ok-button="true"
	@close="$refs.dialog.close()"
	@closed="$emit('closed')"
	@ok="ok()"
>
	<template #header>:{{ emoji.name }}:</template>

	<MkSpacer :margin-min="20" :margin-max="28">
		<div class="yigymqpb _gaps_m">
			<img :src="`/emoji/${emoji.name}.webp`" class="img"/>
			<MkInput v-model="name">
				<template #label>{{ i18n.ts.name }}</template>
			</MkInput>
			<MkInput v-model="category" :datalist="customEmojiCategories">
				<template #label>{{ i18n.ts.category }}</template>
			</MkInput>
			<MkInput v-model="aliases">
				<template #label>{{ i18n.ts.tags }}</template>
				<template #caption>{{ i18n.ts.setMultipleBySeparatingWithSpace }}</template>
			</MkInput>
			<MkInput v-model="license">
				<template #label>{{ i18n.ts.license }}</template>
			</MkInput>
			<MkButton danger @click="del()"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
		</div>
	</MkSpacer>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { customEmojiCategories } from '@/custom-emojis';

const props = defineProps<{
	emoji: any,
}>();

let dialog = $ref(null);
let name: string = $ref(props.emoji.name);
let category: string = $ref(props.emoji.category);
let aliases: string = $ref(props.emoji.aliases.join(' '));
let license: string = $ref(props.emoji.license ?? '');

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
		license: license === '' ? null : license,
	});

	emit('done', {
		updated: {
			id: props.emoji.id,
			name,
			category,
			aliases: aliases.split(' '),
			license: license === '' ? null : license,
		},
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
		id: props.emoji.id,
	}).then(() => {
		emit('done', {
			deleted: true,
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
