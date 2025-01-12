<template>
<MkModalWindow
	ref="dialog"
	:height="500"
	:width="800"
	@click="done(true)"
	@close="done(true)"
	@closed="emit('closed')"
>
	<template #header>
		{{ i18n.ts.drafts }}
	</template>
	<div style="display: flex; flex-direction: column">
		<div v-if="drafts.length === 0" class="empty">
			<div class="_fullinfo">
				<img :src="infoImageUrl" class="_ghost"/>
				<div>{{ i18n.ts.nothing }}</div>
			</div>
		</div>
		<div v-for="draft in drafts" :key="draft.id" :class="$style.draftItem">
			<div :class="$style.draftNote" @click="selectDraft(draft.id)">
				<div :class="$style.draftNoteHeader">
					<div :class="$style.draftNoteDestination">
						<span v-if="draft.channel" style="opacity: 0.7; padding-right: 0.5em">
							<i class="ti ti-device-tv"></i> {{ draft.channel.name }}
						</span>
						<span v-if="draft.renote">
							<i class="ti ti-quote"></i> <MkAcct :user="draft.renote.user" /> <span>{{ draft.renote.text }}</span>
						</span>
						<span v-else-if="draft.reply">
							<i class="ti ti-arrow-back-up"></i> <MkAcct :user="draft.reply.user" /> <span>{{ draft.reply.text }}</span>
						</span>
						<span v-else>
							<i class="ti ti-pencil"></i>
						</span>
					</div>
					<div :class="$style.draftNoteInfo">
						<MkTime :time="draft.createdAt" colored />
						<span v-if="draft.visibility !== 'public'" :title="i18n.ts._visibility[draft.visibility]" style="margin-left: 0.5em">
							<i v-if="draft.visibility === 'home'" class="ti ti-home"></i>
							<i v-else-if="draft.visibility === 'followers'" class="ti ti-lock"></i>
							<i v-else-if="draft.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
						</span>
						<span v-if="draft.localOnly" :title="i18n.ts._visibility['disableFederation']" style="margin-left: 0.5em">
							<i class="ti ti-rocket-off"></i>
						</span>
						<span v-if="draft.channel" :title="draft.channel.name" style="margin-left: 0.5em">
							<i class="ti ti-device-tv"></i>
						</span>
					</div>
				</div>
				<div>
					<p v-if="!!draft.cw" :class="$style.draftNoteCw">
						<Mfm :text="draft.cw" />
					</p>
					<MkSubNoteContent :class="$style.draftNoteText" :note="draft" />
				</div>
			</div>
			<button :class="$style.delete" class="_button" @click="removeDraft(draft.id)">
				<i class="ti ti-trash"></i>
			</button>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { onActivated, onMounted, ref, shallowRef } from 'vue';
import * as Misskey from 'misskey-js';
import { miLocalStorage } from '@/local-storage.js';
import { infoImageUrl } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/account.js';
import MkSubNoteContent from '@/components/MkSubNoteContent.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import type { NoteDraftItem } from '@/types/note-draft-item.js';

const emit = defineEmits<{
	(ev: 'done', v: { canceled: true } | { canceled: false; selected: string | undefined }): void;
	(ev: 'closed'): void;
}>();

const dialog = shallowRef<InstanceType<typeof MkModalWindow>>();

const drafts = ref<(Misskey.entities.Note & { useCw: boolean })[]>([]);

onMounted(loadDrafts);
onActivated(loadDrafts);

function loadDrafts() {
	const stored = JSON.parse(miLocalStorage.getItem('drafts') ?? '{}') as Record<string, NoteDraftItem>;
	drafts.value = Object.keys(stored).map((key) => ({
		...(stored[key].data as Misskey.entities.Note & { useCw: boolean }),
		id: key,
		createdAt: stored[key].updatedAt,
		channel: stored[key].channel as Misskey.entities.Channel,
		renote: stored[key].renote as Misskey.entities.Note,
		reply: stored[key].reply as Misskey.entities.Note,
		user: $i as Misskey.entities.User,
	}));
}

function selectDraft(draft: string) {
	done(false, draft);
}

function removeDraft(draft: string) {
	const stored = JSON.parse(miLocalStorage.getItem('drafts') ?? '{}') as Record<string, NoteDraftItem>;

	delete stored[draft];
	miLocalStorage.setItem('drafts', JSON.stringify(stored));

	loadDrafts();
}

function done(canceled: boolean, selected?: string): void {
	emit('done', { canceled, selected } as
		| { canceled: true }
		| { canceled: false; selected: string | undefined });
	dialog.value?.close();
}
</script>

<style lang="scss" module>
.draftItem {
	display: flex;
	padding: 8px 0 8px 0;
	border-bottom: 1px solid var(--divider);

	&:hover {
		color: var(--accent);
		background-color: var(--accentedBg);
	}
}

.draftNote {
	flex: 1;
	width: calc(100% - 16px - 48px - 4px);
	margin: 0 8px 0 8px;
}

.draftNoteHeader {
	display: flex;
	flex-wrap: nowrap;
	margin-bottom: 4px;
}

.draftNoteDestination {
	flex-shrink: 1;
	flex-grow: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	margin-right: 4px;
}

.draftNoteInfo {
	flex-shrink: 0;
	margin-left: auto;
}

.draftNoteCw {
	cursor: default;
	display: block;
	overflow-wrap: break-word;
}

.draftNoteText {
	cursor: default;
}

.delete {
	width: 48px;
	height: 64px;
	display: flex;
	align-self: center;
	justify-content: center;
	align-items: center;
	background-color: var(--buttonBg);
	border-radius: 4px;
	margin-right: 4px;
}
</style>
