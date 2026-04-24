<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="{ [$style.done]: closed || isVoted }">
	<ul :class="$style.choices">
		<li v-for="(choice, i) in choices" :key="i" :class="$style.choice" @click="vote(i)">
			<div :class="$style.bg" :style="{ 'width': `${showResult ? (choice.votes / total * 100) : 0}%` }"></div>
			<span :class="$style.fg">
				<template v-if="choice.isVoted"><i class="ti ti-check" style="margin-right: 4px; color: var(--MI_THEME-accent);"></i></template>
				<Mfm :text="choice.text" :plain="true" :author="author" :emojiUrls="emojiUrls"/>
				<span v-if="showResult" style="margin-left: 4px; opacity: 0.7;">({{ i18n.tsx._poll.votesCount({ n: choice.votes }) }})</span>
			</span>
		</li>
	</ul>
	<p v-if="!readOnly" :class="$style.info">
		<span>{{ i18n.tsx._poll.totalVotes({ n: total }) }}</span>
		<span> · </span>
		<a v-if="!closed && !isVoted" style="color: inherit;" @click="showResult = !showResult">{{ showResult ? i18n.ts._poll.vote : i18n.ts._poll.showResult }}</a>
		<span v-if="isVoted">{{ i18n.ts._poll.voted }}</span>
		<span v-else-if="closed">{{ i18n.ts._poll.closed }}</span>
		<span v-if="remaining > 0"> · {{ timer }}</span>
	</p>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { host } from '@@/js/config.js';
import type { OpenOnRemoteOptions } from '@/utility/please-login.js';
import { sum } from '@/utility/array.js';
import { pleaseLogin } from '@/utility/please-login.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { useLowresTime } from '@/composables/use-lowres-time.js';

const props = defineProps<{
	noteId: string;
	multiple: NonNullable<Misskey.entities.Note['poll']>['multiple'];
	expiresAt: NonNullable<Misskey.entities.Note['poll']>['expiresAt'];
	choices: NonNullable<Misskey.entities.Note['poll']>['choices'];
	readOnly?: boolean;
	emojiUrls?: Record<string, string>;
	author?: Misskey.entities.UserLite;
}>();

const now = useLowresTime();

const expiresAtTime = computed(() => props.expiresAt ? new Date(props.expiresAt).getTime() : null);

const remaining = computed(() => {
	if (expiresAtTime.value == null) return -1;
	return Math.floor(Math.max(expiresAtTime.value - now.value, 0) / 1000);
});

const total = computed(() => sum(props.choices.map(x => x.votes)));
const closed = computed(() => props.expiresAt != null && remaining.value <= 0);
const isVoted = computed(() => !props.multiple && props.choices.some(c => c.isVoted));
const timer = computed(() => i18n.tsx._poll[
	remaining.value >= 86400 ? 'remainingDays' :
	remaining.value >= 3600 ? 'remainingHours' :
	remaining.value >= 60 ? 'remainingMinutes' : 'remainingSeconds'
]({
	s: Math.floor(remaining.value % 60),
	m: Math.floor(remaining.value / 60) % 60,
	h: Math.floor(remaining.value / 3600) % 24,
	d: Math.floor(remaining.value / 86400),
}));

const showResult = ref(props.readOnly || isVoted.value || closed.value);

if (!closed.value) {
	const closedWatchStop = watch(closed, (isNowClosed) => {
		if (isNowClosed) {
			showResult.value = true;
			closedWatchStop();
		}
	});
}

const pleaseLoginContext = computed<OpenOnRemoteOptions>(() => ({
	type: 'lookup',
	url: `https://${host}/notes/${props.noteId}`,
}));

const vote = async (id: number) => {
	if (props.readOnly || closed.value || isVoted.value) return;

	const isLoggedIn = await pleaseLogin({ openOnRemote: pleaseLoginContext.value });
	if (!isLoggedIn) return;

	const { canceled } = await os.confirm({
		type: 'question',
		text: i18n.tsx.voteConfirm({ choice: props.choices[id].text }),
	});
	if (canceled) return;

	await misskeyApi('notes/polls/vote', {
		noteId: props.noteId,
		choice: id,
	});
	if (!showResult.value) showResult.value = !props.multiple;
};
</script>

<style lang="scss" module>
.choices {
	display: block;
	margin: 0;
	padding: 0;
	list-style: none;
}

.choice {
	display: block;
	position: relative;
	margin: 4px 0;
	padding: 4px;
	//border: solid 0.5px var(--MI_THEME-divider);
	background: var(--MI_THEME-accentedBg);
	border-radius: 4px;
	overflow: clip;
	cursor: pointer;
}

.bg {
	position: absolute;
	top: 0;
	left: 0;
	height: 100%;
	background: var(--MI_THEME-accent);
	background: linear-gradient(90deg,var(--MI_THEME-buttonGradateA),var(--MI_THEME-buttonGradateB));
	transition: width 1s ease;
}

.fg {
	position: relative;
	display: inline-block;
	padding: 3px 5px;
	background: var(--MI_THEME-panel);
	border-radius: 3px;
}

.info {
	color: var(--MI_THEME-fg);
}

.done {
	.choice {
		cursor: initial;
	}
}
</style>
