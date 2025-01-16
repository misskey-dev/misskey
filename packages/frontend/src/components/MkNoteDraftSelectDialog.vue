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
				<div v-for="draft in drafts" :key="draft.id" class="_button" :class="[$style.draft, { [$style.selected]: selected && selected.id === draft.id }]" @click="selected = draft" @dblclick="ok()">
					<div :class="$style.draftContainer">
						<div :class="$style.draftHeader">
							<div :class="$style.headerLeft">
								<div v-if="draft.reply">
									<i class="ti ti-arrow-back-up"></i><MkAvatar :user="draft.reply.user" :class="$style.headerAvater"/><span>{{ truncateText(draft.reply.text, 10) }}</span>
								</div>
								<div v-else-if="draft.renote">
									<i class="ti ti-quote"></i><MkAvatar :user="draft.renote.user" :class="$style.headerAvater"/><span>{{ truncateText(draft.renote?.text, 10) }}</span>
								</div>
								<div v-else>
									<i class="ti ti-pencil-minus"></i>
								</div>
							</div>
							<div :class="$style.headerRight">
								<div style="margin-left: 0.5em;" :title="i18n.ts._visibility[draft.visibility]">
									<i v-if="draft.visibility === 'public'" class="ti ti-world"></i>
									<i v-else-if="draft.visibility === 'home'" class="ti ti-home"></i>
									<i v-else-if="draft.visibility === 'followers'" class="ti ti-lock"></i>
									<i v-else-if="draft.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
								</div>
							</div>
						</div>
						<div :class="$style.draftBody">
							<div v-if="draft.cw != null" class="cw">{{ truncateText(draft.cw, 20) }}</div>
							{{ truncateText(draft.text, 20) }}
						</div>
					</div>
				</div>
				<div v-if="drafts.length === 0" class="_empty" :class="$style.empty">{{ i18n.ts.noDrafts }}</div>
			</div>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { onMounted, ref, shallowRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';

const emit = defineEmits<{
	(ev: 'ok', selected: Misskey.entities.NoteDraft): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const drafts = ref<Misskey.entities.NoteDraft[]>([]);

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

onMounted(() => {
	misskeyApi('notes/drafts', {}).then(_drafts => {
		drafts.value = _drafts as unknown as Misskey.entities.NoteDraft[];
	});
});
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

.headerAvater {
	width: 1.2em;
	height: 1.2em;
	margin: 0 0.5em;
}

.draftBody {
	padding: 0 8px;
	min-width: 0;
}

.empty {
	opacity: 0.7;
	text-align: center;
	padding: 16px;
}
</style>
