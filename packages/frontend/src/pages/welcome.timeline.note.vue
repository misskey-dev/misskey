<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :key="note.id" :class="$style.note">
	<div class="_panel _gaps_s" :class="$style.content">
		<div ref="noteTextEl" :class="[$style.text, { [$style.collapsed]: shouldCollapse }]">
			<MkA v-if="note.replyId" class="reply" :to="`/notes/${note.replyId}`"><i class="ti ti-arrow-back-up"></i></MkA>
			<Mfm v-if="note.text" :text="note.text" :author="note.user"/>
			<MkA v-if="note.renoteId" class="rp" :to="`/notes/${note.renoteId}`">RN: ...</MkA>
		</div>
		<div v-if="note.files && note.files.length > 0" :class="$style.richcontent">
			<MkMediaList :mediaList="note.files.slice(0, 4)"/>
		</div>
		<div v-if="note.poll">
			<MkPoll :noteId="note.id" :poll="note.poll" :readOnly="true"/>
		</div>
		<div v-if="note.reactionCount > 0" :class="$style.reactions">
			<MkReactionsViewer :note="note" :maxNumber="16"/>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, shallowRef, onUpdated } from 'vue';
import * as Misskey from 'misskey-js';
import MkReactionsViewer from '@/components/MkReactionsViewer.vue';
import MkMediaList from '@/components/MkMediaList.vue';
import MkPoll from '@/components/MkPoll.vue';

defineProps<{
	note: Misskey.entities.Note;
}>();

const noteTextEl = shallowRef<HTMLDivElement>();
const shouldCollapse = ref(false);

onUpdated(() => {
	if (noteTextEl.value) {
		const height = noteTextEl.value.scrollHeight;
		if (height > 200) {
			shouldCollapse.value = true;
		}
	}
});
</script>

<style lang="scss" module>
.note {
	margin-left: auto;
}

.text {
	position: relative;
	max-height: 200px;
	overflow: hidden;

	&.collapsed::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 64px;
		background: linear-gradient(0deg, var(--panel), var(--X15));
	}
}

.content {
	padding: 16px;
	margin: 0 0 0 auto;
	max-width: max-content;
	border-radius: 16px;
}

.reactions {
	box-sizing: border-box;
	margin: 8px -16px -8px;
	padding: 8px 16px 0;
	width: calc(100% + 32px);
	border-top: 1px solid var(--divider);
}

.richcontent {
	min-width: 250px;
}
</style>
