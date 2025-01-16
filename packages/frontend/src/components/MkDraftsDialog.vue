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
	<MkTab v-if="$i!.policies.canScheduleNote" v-model="tab" style="margin-bottom: var(--margin);">
		<option value="unsent">{{ i18n.ts.unsent }}</option>
		<option value="scheduled">{{ i18n.ts.scheduled }}</option>
	</MkTab>
	<div v-if="tab === 'unsent'" style="display: flex; flex-direction: column">
		<div v-if="drafts.length === 0" class="empty">
			<div class="_fullinfo">
				<img :src="infoImageUrl" class="_ghost"/>
				<div>{{ i18n.ts.nothing }}</div>
			</div>
		</div>
		<div v-for="draft in drafts" :key="draft.id" :class="[$style.draftItem, $style.draftItemHover]">
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
						<div style="display: flex; gap: 4px">
							<div v-if="draft.scheduledAt" style="display: flex; opacity: 0.6">
								<span><i class="ti ti-calendar-clock" style="margin-right: 4px;"/></span>
								<MkTime :time="draft.scheduledAt"/>
							</div>
							<MkTime :time="draft.createdAt" colored />
						</div>
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
			<button v-tooltip="i18n.ts.delete" :class="$style.button" class="_button" @click="removeDraft(draft.id)">
				<i class="ti ti-trash"></i>
			</button>
		</div>
	</div>
	<MkPagination v-if="tab === 'scheduled'" ref="scheduledPaginationEl" :pagination="scheduledPagination">
		<template #empty>
			<div class="_fullinfo">
				<img :src="infoImageUrl" class="_ghost"/>
				<div>{{ i18n.ts.nothing }}</div>
			</div>
		</template>
		<template #default="{ items }">
			<div v-for="draft in items.map(x => convertNoteDraftToNoteCompat(x))" :key="draft.id" :class="$style.draftItem">
				<div :class="$style.draftNote">
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
							<div style="display: flex; gap: 4px">
								<div v-if="draft.scheduledAt" style="display: flex; opacity: 0.6">
									<span><i class="ti ti-calendar-clock" style="margin-right: 4px;"/></span>
									<MkTime :time="draft.scheduledAt"/>
								</div>
								<div v-else style="display: flex; opacity: 0.6">
									<span><i class="ti ti-exclamation-circle"/></span>
								</div>
								<MkTime :time="draft.createdAt" colored />
							</div>
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
						<div v-if="draft.reason" style="opacity: 0.6; margin-top: 4px">
							{{ i18n.ts.error }}: {{ draft.reason }}
						</div>
					</div>
				</div>
				<button v-tooltip="i18n.ts.unschedule" :class="$style.button" class="_button" @click="unschedule(draft.id)">
					<i class="ti ti-calendar-x"></i>
				</button>
				<button v-tooltip="i18n.ts.delete" :class="$style.button" class="_button" @click="cancelScheduled(draft.id)">
					<i class="ti ti-trash"></i>
				</button>
			</div>
		</template>
	</MkPagination>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { onActivated, onMounted, ref, shallowRef } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import { miLocalStorage } from '@/local-storage.js';
import { infoImageUrl } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/account.js';
import MkSubNoteContent from '@/components/MkSubNoteContent.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkTab from '@/components/MkTab.vue';

const emit = defineEmits<{
	(ev: 'done', v: { canceled: true } | { canceled: false; selected: string | undefined }): void;
	(ev: 'closed'): void;
}>();

const dialog = shallowRef<InstanceType<typeof MkModalWindow>>();
const tab = ref('unsent');

const drafts = ref<(Misskey.entities.Note & { useCw: boolean, scheduledAt: string })[]>([]);

onMounted(loadDrafts);
onActivated(loadDrafts);

function convertNoteDraftToNoteCompat(draft: Misskey.entities.NoteDraft, key?: string) {
	return {
		...(draft.data as Misskey.entities.Note & { useCw: boolean }),
		id: key ?? draft.id,
		createdAt: draft.updatedAt,
		scheduledAt: draft.scheduledAt,
		reason: draft.reason,
		channel: draft.channel as Misskey.entities.Channel,
		renote: draft.renote as Misskey.entities.Note,
		reply: draft.reply as Misskey.entities.Note,
		user: $i as Misskey.entities.User,
	};
}

function loadDrafts() {
	const stored = JSON.parse(miLocalStorage.getItem('drafts') ?? '{}') as Record<string, Misskey.entities.NoteDraft>;
	drafts.value = Object.keys(stored).map((key) => convertNoteDraftToNoteCompat(stored[key], key));
}

function selectDraft(draft: string) {
	done(false, draft);
}

function removeDraft(draft: string) {
	const stored = JSON.parse(miLocalStorage.getItem('drafts') ?? '{}') as Record<string, Misskey.entities.NoteDraft>;

	delete stored[draft];
	miLocalStorage.setItem('drafts', JSON.stringify(stored));

	loadDrafts();
}

function unschedule(draft: string) {
	const item = scheduledPaginationEl.value!.items.find(x => x.id === draft);
	if (!item) return;

	let key = item.channel ? `channel:${item.channel.id}` : '';
	if (item.renote) {
		key += `renote:${item.renote.id}`;
	} else if (item.reply) {
		key += `reply:${item.reply.id}`;
	} else {
		key += `note:${item.id}`;
	}

	const stored = JSON.parse(miLocalStorage.getItem('drafts') ?? '{}') as Record<string, Misskey.entities.NoteDraft>;

	stored[key] = item as unknown as Misskey.entities.NoteDraft;
	miLocalStorage.setItem('drafts', JSON.stringify(stored));

	cancelScheduled(item.id);
	loadDrafts();
	tab.value = 'unsent';
}

function cancelScheduled(draft: string) {
	os.apiWithDialog('notes/scheduled/cancel', {
		draftId: draft,
	}).then(() => {
		scheduledPaginationEl.value?.reload();
	});
}

function done(canceled: boolean, selected?: string): void {
	emit('done', { canceled, selected } as
		| { canceled: true }
		| { canceled: false; selected: string | undefined });
	dialog.value?.close();
}

const scheduledPaginationEl = ref<InstanceType<typeof MkPagination>>();

const scheduledPagination = {
	endpoint: 'notes/scheduled/list' as const,
	offsetMode: true,
	limit: 10,
	params: {},
};

</script>

<style lang="scss" module>
.draftItem {
	display: flex;
	padding: 8px 0 8px 0;
	border-bottom: 1px solid var(--divider);
}

.draftItemHover {
	&:hover {
		color: var(--accent);
		background: var(--accentedBg);
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

.button {
	width: 48px;
	height: 64px;
	display: flex;
	align-self: center;
	justify-content: center;
	align-items: center;
	background: var(--buttonBg);
	border-radius: 4px;
	margin-right: 4px;

	&:hover {
		background: var(--buttonHoverBg);
	}
}
</style>
