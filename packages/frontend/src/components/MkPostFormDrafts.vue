<template>
<MkModalWindow
	ref="dialog"
	:width="500"
	:height="600"
	@close="dialog?.close()"
	@closed="$emit('closed')"
>
	<template #header>{{ i18n.ts.drafts }}</template>

	<div :class="$style.container">
		<div v-if="notes === null" :class="$style.center">{{ i18n.ts.loading }}</div>
		<div v-else-if="Object.keys(notes).length === 0" :class="$style.center">{{ i18n.ts.nothing }}</div>
		<div v-for="(note, key) of notes" v-else :key="key" class="_panel" :class="$style.wrapper">
			<div v-if="note" :class="$style.note" :aria-disabled="!noteFilter(note)" @click="() => select(note)">
				<div v-if="note.type === 'quote'" :class="$style.subtext"><i class="ti ti-quote"></i> {{ i18n.ts.quote }}</div>
				<div v-if="note.type === 'reply'" :class="$style.subtext"><i class="ti ti-arrow-back-up"></i> {{ i18n.ts.reply }}</div>
				<div v-if="note.type === 'channel'" :class="$style.subtext"><i class="ti ti-device-tv"></i> {{ i18n.ts.channel }}</div>
				<Mfm v-if="note.data.text" :text="note.data.text" :nyaize="'respect'"/>
				<div :class="[$style.subtext, $style.bottom]">
					<MkTime :time="note.updatedAt"/>
					<div v-if="note.data.files.length"><i class="ti ti-photo-plus" :class="$style.icon"></i>{{ note.data.files.length }}</div>
				</div>
			</div>
			<div :class="$style.trash" @click="() => remove(note)"><i class="ti ti-trash"></i></div>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { shallowRef, ref, onMounted } from 'vue';
import * as noteDrafts from '@/scripts/note-drafts.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n.js';
import { signinRequired } from '@/account.js';
import * as os from '@/os.js';

const $i = signinRequired();

const props = defineProps<{
	channelId?: string;
}>();

const emit = defineEmits<{
	(ev: 'selected', res: noteDrafts.NoteDraft): void;
	(ev: 'closed'): void;
}>();

const dialog = shallowRef<InstanceType<typeof MkModalWindow>>();
const notes = ref<Record<string, noteDrafts.NoteDraft | undefined> | null>(null);

function noteFilter(note: noteDrafts.NoteDraft | undefined) {
	if (!note) return false;

	// チャンネルモードの場合はチャンネル内での下書きのみを表示
	if (props.channelId) return note.type === 'channel' && note.auxId === props.channelId;

	// チャンネル外ならチャンネル内の下書きは表示しない
	if (note.type === 'channel') return false;

	return true;
}

function select(note: noteDrafts.NoteDraft) {
	if (!noteFilter(note)) return;
	emit('selected', note);
	dialog.value?.close();
}

async function remove(note: noteDrafts.NoteDraft | undefined) {
	if (!note) return;

	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts.deleteConfirm,
	});

	if (canceled) return;
	await noteDrafts.remove(note.type, $i.id, note.uniqueId, note.auxId as string);
	notes.value = await noteDrafts.getAll($i.id);
}

onMounted(async () => {
	notes.value = await noteDrafts.getAll($i.id);
});
</script>

<style lang="scss" module>
.container {
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 16px;
	overflow-x: clip;
	padding: 16px;
}

.wrapper {
	display: flex;
	border-radius: 12px;
	cursor: pointer;
}

.note {
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding: 10px;
	gap: 6px;
	flex-grow: 1;
	background-color: var(--buttonBg);

	&:hover:not([aria-disabled="true"]) {
		background-color: var(--buttonHoverBg);
	}

	&[aria-disabled="true"] {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.subtext {
	font-size: 0.8em;
	opacity: 0.7;
	user-select: none;
}

.bottom {
	display: flex;
	gap: 12px;
}

.icon {
	margin-right: 4px;
}

.center {
	text-align: center;
}

.trash {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 16px;
	background-color: var(--buttonBg);
	color: var(--error);

	&:hover {
		background-color: var(--error);
		color: white;
	}
}
</style>
