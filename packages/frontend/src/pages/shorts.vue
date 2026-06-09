<!--
SPDX-FileCopyrightText: Rickskey Project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 600px; --MI_SPACER-min: 0px;">
		<div v-if="notes == null" class="_gaps" style="padding: 16px;">
			<MkLoading/>
		</div>
		<div v-else-if="notes.length === 0" class="_gaps" style="padding: 16px;">
			<MkInfo>{{ i18n.ts._shorts.noShorts }}</MkInfo>
		</div>
		<div v-else :class="$style.feed">
			<div
				v-for="note in notes"
				:key="note.id"
				:class="$style.shortCard"
			>
				<!-- 動画プレイヤー -->
				<div :class="$style.videoWrap">
					<video
						v-if="getVideoFile(note)"
						:src="getVideoFile(note)!.url"
						:class="$style.video"
						controls
						playsinline
						loop
						preload="metadata"
					></video>
				</div>

				<!-- 情報欄 -->
				<div :class="$style.info">
					<div :class="$style.author">
						<MkAvatar :user="note.user" :class="$style.avatar" link/>
						<div>
							<MkUserName :user="note.user" :class="$style.username"/>
							<div :class="$style.date">{{ new Date(note.createdAt).toLocaleString() }}</div>
						</div>
					</div>
					<div v-if="note.text" :class="$style.caption">
						<Mfm :text="note.text" :author="note.user"/>
					</div>
					<div :class="$style.actions">
						<button :class="$style.actionBtn" @click="openNote(note)">
							<i class="ti ti-external-link"></i>
						</button>
					</div>
				</div>
			</div>

			<div v-if="hasMore" style="padding: 16px; text-align: center;">
				<MkButton @click="loadMore">{{ i18n.ts.loadMore }}</MkButton>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';
import { useRouter } from '@/router.js';
import MkAvatar from '@/components/MkAvatar.vue';
import MkUserName from '@/components/MkUserName.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkLoading from '@/pages/_loading_.vue';
import MkButton from '@/components/MkButton.vue';
import Mfm from '@/components/Mfm.vue';

const router = useRouter();

const notes = ref<Misskey.entities.Note[] | null>(null);
const hasMore = ref(false);
let untilId: string | undefined;

function getVideoFile(note: Misskey.entities.Note) {
	return note.files?.find(f => f.type.startsWith('video/')) ?? null;
}

async function load(append = false) {
	const result = await misskeyApi('shorts', {
		limit: 10,
		...(untilId ? { untilId } : {}),
	}) as Misskey.entities.Note[];

	if (append) {
		notes.value = [...(notes.value ?? []), ...result];
	} else {
		notes.value = result;
	}

	hasMore.value = result.length === 10;
	if (result.length > 0) {
		untilId = result[result.length - 1].id;
	}
}

async function loadMore() {
	await load(true);
}

function openNote(note: Misskey.entities.Note) {
	router.push(`/notes/${note.id}`);
}

onMounted(() => load());

const headerActions = computed(() => []);
const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.shorts,
	icon: 'ti ti-player-play',
}));
</script>

<style lang="scss" module>
.feed {
	display: flex;
	flex-direction: column;
	gap: 0;
}

.shortCard {
	position: relative;
	background: #000;
	border-bottom: 1px solid var(--MI_THEME-divider);
}

.videoWrap {
	width: 100%;
	aspect-ratio: 9 / 16;
	max-height: 80vh;
	background: #000;
	display: flex;
	align-items: center;
	justify-content: center;
}

.video {
	width: 100%;
	height: 100%;
	object-fit: contain;
}

.info {
	padding: 12px 16px;
	background: var(--MI_THEME-panel);
}

.author {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 8px;
}

.avatar {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	flex-shrink: 0;
}

.username {
	font-weight: bold;
	font-size: 0.95em;
}

.date {
	font-size: 0.8em;
	color: var(--MI_THEME-fgTransparent);
}

.caption {
	font-size: 0.9em;
	margin-bottom: 8px;
	line-height: 1.5;
}

.actions {
	display: flex;
	gap: 8px;
	justify-content: flex-end;
}

.actionBtn {
	background: none;
	border: none;
	cursor: pointer;
	color: var(--MI_THEME-fgTransparent);
	font-size: 1.1em;
	padding: 4px 8px;
	border-radius: 6px;

	&:hover {
		color: var(--MI_THEME-fg);
		background: var(--MI_THEME-buttonBg);
	}
}
</style>
