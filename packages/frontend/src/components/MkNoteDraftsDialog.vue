<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialogEl"
	:width="600"
	:height="650"
	:withOkButton="false"
	@click="cancel()"
	@close="cancel()"
	@closed="emit('closed')"
	@esc="cancel()"
>
	<template #header>
		{{ i18n.ts.drafts }} ({{ currentDraftsCount }}/{{ $i?.policies.noteDraftLimit }})
	</template>
	<div class="_spacer">
		<MkPagination :paginator="paginator" withControl>
			<template #empty>
				<MkResult type="empty" :text="i18n.ts._drafts.noDrafts"/>
			</template>

			<template #default="{ items }">
				<div class="_gaps_s">
					<div
						v-for="draft in (items as unknown as Misskey.entities.NoteDraft[])"
						:key="draft.id"
						v-panel
						:class="[$style.draft]"
					>
						<div :class="$style.draftBody" class="_gaps_s">
							<div :class="$style.draftInfo">
								<div :class="$style.draftMeta">
									<div v-if="draft.reply" class="_nowrap">
										<i class="ti ti-arrow-back-up"></i> <I18n :src="i18n.ts._drafts.replyTo" tag="span">
											<template #user>
												<Mfm v-if="draft.reply.user.name != null" :text="draft.reply.user.name" :plain="true" :nowrap="true"/>
												<MkAcct v-else :user="draft.reply.user"/>
											</template>
										</I18n>
									</div>
									<div v-if="draft.renote && draft.text != null" class="_nowrap">
										<i class="ti ti-quote"></i> <I18n :src="i18n.ts._drafts.quoteOf" tag="span">
											<template #user>
												<Mfm v-if="draft.renote.user.name != null" :text="draft.renote.user.name" :plain="true" :nowrap="true"/>
												<MkAcct v-else :user="draft.renote.user"/>
											</template>
										</I18n>
									</div>
									<div v-if="draft.channel" class="_nowrap">
										<i class="ti ti-device-tv"></i> {{ i18n.tsx._drafts.postTo({ channel: draft.channel.name }) }}
									</div>
								</div>
							</div>
							<div :class="$style.draftContent">
								<Mfm :text="getNoteSummary(draft, { showRenote: false, showReply: false })" :plain="true" :author="draft.user"/>
							</div>
							<div :class="$style.draftFooter">
								<div :class="$style.draftVisibility">
									<span :title="i18n.ts._visibility[draft.visibility]">
										<i v-if="draft.visibility === 'public'" class="ti ti-world"></i>
										<i v-else-if="draft.visibility === 'home'" class="ti ti-home"></i>
										<i v-else-if="draft.visibility === 'followers'" class="ti ti-lock"></i>
										<i v-else-if="draft.visibility === 'specified'" class="ti ti-mail"></i>
									</span>
									<span v-if="draft.localOnly" :title="i18n.ts._visibility['disableFederation']"><i class="ti ti-rocket-off"></i></span>
								</div>
								<MkTime :time="draft.createdAt" :class="$style.draftCreatedAt" mode="detail" colored/>
							</div>
						</div>
						<div :class="$style.draftActions" class="_buttons">
							<MkButton
								:class="$style.itemButton"
								small
								@click="restoreDraft(draft)"
							>
								<i class="ti ti-corner-up-left"></i>
								{{ i18n.ts._drafts.restore }}
							</MkButton>
							<MkButton
								v-tooltip="i18n.ts._drafts.delete"
								danger
								small
								:iconOnly="true"
								:class="$style.itemButton"
								@click="deleteDraft(draft)"
							>
								<i class="ti ti-trash"></i>
							</MkButton>
						</div>
					</div>
				</div>
			</template>
		</MkPagination>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, shallowRef, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { getNoteSummary } from '@/utility/get-note-summary.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { $i } from '@/i.js';
import { misskeyApi } from '@/utility/misskey-api';
import { Paginator } from '@/utility/paginator.js';

const emit = defineEmits<{
	(ev: 'restore', draft: Misskey.entities.NoteDraft): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const paginator = markRaw(new Paginator('notes/drafts/list', {
	limit: 10,
}));

const currentDraftsCount = ref(0);
misskeyApi('notes/drafts/count').then((count) => {
	currentDraftsCount.value = count;
});

const dialogEl = shallowRef<InstanceType<typeof MkModalWindow>>();

function cancel() {
	emit('cancel');
	dialogEl.value?.close();
}

function restoreDraft(draft: Misskey.entities.NoteDraft) {
	emit('restore', draft);
	dialogEl.value?.close();
}

async function deleteDraft(draft: Misskey.entities.NoteDraft) {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts._drafts.deleteAreYouSure,
	});

	if (canceled) return;

	os.apiWithDialog('notes/drafts/delete', { draftId: draft.id }).then(() => {
		paginator.reload();
	});
}
</script>

<style lang="scss" module>
.draft {
	padding: 16px;
	gap: 16px;
	border-radius: 10px;
}

.draftBody {
	width: 100%;
	min-width: 0;
}

.draftInfo {
	display: flex;
	width: 100%;
	font-size: 0.85em;
	opacity: 0.7;
}

.draftMeta {
	flex-grow: 1;
	min-width: 0;
}

.draftContent {
	display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
	line-clamp: 2;
  overflow: hidden;
	font-size: 0.9em;
}

.draftFooter {
	display: flex;
	align-items: center;
	gap: 8px;
}

.draftVisibility {
	flex-shrink: 0;
}

.draftCreatedAt {
	font-size: 85%;
	opacity: 0.7;
}

.draftActions {
	margin-top: 16px;
	padding-top: 16px;
	border-top: solid 1px var(--MI_THEME-divider);
}
</style>
