<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialogEl"
	:withOkButton="true"
	:okButtonDisabled="selected == null"
	@click="cancel()"
	@close="cancel()"
	@ok="ok()"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.selectDraft }}</template>
	<div>
		<div :class="$style.result">
			<div :class="$style.drafts">
				<MkPagination ref="pagingEl" :pagination="paging">
					<template #empty>
						<div class="_fullinfo">
							<img :src="infoImageUrl" class="_ghost"/>
							<div>{{ i18n.ts.noDrafts }}</div>
						</div>
					</template>

					<template #default="{ items }">
						<button
							v-for="draft in items"
							:key="draft.id"
							class="_button"
							:class="[$style.draft, { [$style.selected]: selected && selected.id === draft.id }]"
							type="button"
							@click="selected = draft"
							@dblclick="ok()"
						>
							<div :class="$style.draftContainer">
								<div :class="$style.draftContent">
									<div :class="$style.draftHeader">
										<div :class="$style.headerLeft">
											<div v-if="draft.reply">
												<i class="ti ti-arrow-back-up"></i><MkAvatar :user="draft.reply.user" :class="$style.headerAvater"/>@{{ `${draft.reply.user.username}${ draft.reply.user.host ? `@${draft.reply.user.host}` : '' }` }} <span>{{ truncateText(draft.reply.text, 10) }}</span>
											</div>
											<div v-else-if="draft.renote">
												<i class="ti ti-quote"></i><MkAvatar :user="draft.renote.user" :class="$style.headerAvater"/>@{{ `${draft.renote.user.username}${ draft.renote.user.host ? `@${draft.renote.user.host}` : '' }` }} <span>{{ truncateText(draft.renote?.text, 10) }}</span>
											</div>
											<div v-else>
												<i class="ti ti-pencil-minus"></i>
											</div>
										</div>
										<div :class="$style.headerRight">
											<div style="margin-left: 0.5em;" :title="i18n.ts._visibility[draft.visibility]">
												<i v-if="draft.visibility === 'public' && draft.channel == null" class="ti ti-world"></i>
												<i v-else-if="draft.visibility === 'home'" class="ti ti-home"></i>
												<i v-else-if="draft.visibility === 'followers'" class="ti ti-lock"></i>
												<i v-else-if="draft.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
											</div>
											<span v-if="draft.channel" v-tooltip="i18n.ts.channel"><i class="ti ti-device-tv"></i> </span>
											<span v-if="draft.localOnly" v-tooltip="i18n.ts.localOnly"><i class="ti ti-rocket-off"></i></span>
										</div>
									</div>
									<div :class="$style.draftBody">
										<div v-if="draft.cw != null" class="cw">{{ truncateText(draft.cw, 20) }}</div>
										{{ truncateText(draft.text, 20) }}
									</div>
								</div>
								<MkButton short :class="$style.deleteButton" @click="deleteDraft(draft)"><i class="ti ti-trash"></i></MkButton>
							</div>
						</button>
					</template>
				</MkPagination>
			</div>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, shallowRef, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkPagination, { type Paging } from '@/components/MkPagination.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { infoImageUrl } from '@/instance.js';

const emit = defineEmits<{
	(ev: 'ok', selected: Misskey.entities.NoteDraft): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const paging = {
	endpoint: 'notes/drafts',
	limit: 10,
} satisfies Paging;

const pagingComponent = useTemplateRef('pagingEl');

const selected = ref<Misskey.entities.NoteDraft | null>(null);
const dialogEl = shallowRef<InstanceType<typeof MkModalWindow>>();

function truncateText(text: string | null, length: number) {
	if (text == null) return '';
	if (text.length <= length) return text;
	return text.slice(0, length) + '...';
}

async function ok() {
	if (selected.value == null) return;

	emit('ok', selected.value);

	dialogEl.value?.close();
}

function cancel() {
	emit('cancel');
	dialogEl.value?.close();
}

function deleteDraft(draft: Misskey.entities.NoteDraft) {
	misskeyApi('notes/drafts/delete', { draftId: draft.id }).then(() => {
		pagingComponent.value?.reload();
	});
}
</script>

<style lang="scss" module>

.form {
	padding: calc(var(--root-margin) / 2) var(--root-margin);
}

.result {
	display: flex;
	flex-direction: column;
	overflow: auto;
	height: 100%;

	&.result {
		padding: 0;
	}
}

.drafts {
	flex: 1;
	overflow: auto;
	padding: 8px 0;
}

.draft {
	display: flex;
	align-items: center;
	padding: 8px var(--root-margin);
	font-size: 14px;

	&:hover {
		background: var(--MI_THEME-X7);
	}

	&.selected {
		background: var(--MI_THEME-accent);
		color: #fff;
	}
}

.draftContainer {
	display: flex;
	flex: 1;
	flex-basis: 100%;
}

.draftContent {
	display: flex;
	flex-direction: column;
	flex: 1;
	flex-basis: 100%;
}

.draftHeader {
	display: flex;
	justify-content: space-between;
	flex-grow: 1;
	padding-bottom: 2px;
}

.headerLeft {
	display: flex;
	align-items: center;
}

.headerRight {
	display: flex;
	align-items: center;
}

.headerAvater {
	width: 1.2em;
	height: 1.2em;
	margin: 0 0.5em;
}

.draftBody {
	padding: 0 8px;
	min-width: 0;
}

.deleteButton {
	align-self: center;
	margin-left: 0.5em;
	min-width: 40px;
}
</style>
