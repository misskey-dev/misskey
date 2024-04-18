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
		<template v-for="(note, key) of notes" :key="key">
			<div v-if="note && noteFilter(key)" class="_panel" :class="$style.note" @click="() => select(key)">
				<div v-if="key.startsWith('renote:')" :class="$style.subtext"><i class="ti ti-quote"></i> {{ i18n.ts.quote }}</div>
				<div v-if="key.startsWith('reply:')" :class="$style.subtext"><i class="ti ti-arrow-back-up"></i> {{ i18n.ts.reply }}</div>
				<Mfm v-if="note.data.text" :text="note.data.text" :nyaize="'respect'"/>
				<div :class="[$style.subtext, $style.bottom]">
					<MkTime :time="note.updatedAt"/>
					<div v-if="note.data.files.length"><i class="ti ti-photo-plus" :class="$style.icon"></i>{{ note.data.files.length }}</div>
				</div>
			</div>
		</template>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { shallowRef, computed } from 'vue';
import * as noteDrafts from '@/scripts/note-drafts.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n.js';
import { $i } from '@/account';

const props = withDefaults(defineProps<{
	channel: boolean;
}>(), {
	channel: false,
});

const emit = defineEmits<{
	(ev: 'selected', res: string): void;
	(ev: 'closed'): void;
}>();

const dialog = shallowRef<InstanceType<typeof MkModalWindow>>();
const notes = computed(() => noteDrafts.getAll());

function noteFilter(key: string) {
	// チャンネルモードの場合はチャンネル内での下書きのみを表示
	if (props.channel) return key.startsWith('channel:');

	// チャンネル外ならチャンネル内の下書きは表示しない
	if (key.startsWith('channel:')) return false;
	if (key.startsWith('note:')) return key.startsWith(`note:${$i?.id}`);

	return true;
}

function select(key: string) {
	emit('selected', key);
	dialog.value?.close();
}
</script>

<style lang="scss" module>
.container {
	display: flex;
	flex-direction: column;
	gap: 16px;
	overflow-x: clip;
	padding: 16px;
}

.note {
	display: flex;
	flex-direction: column;
	padding: 10px;
	gap: 6px;
	border-radius: 12px;
	background-color: var(--buttonBg);
	cursor: pointer;

	&:hover {
		background-color: var(--buttonHoverBg);
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
</style>
