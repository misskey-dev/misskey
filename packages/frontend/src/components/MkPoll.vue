<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="{ [$style.done]: closed || isVoted }">
	<ul :class="$style.choices">
		<li v-for="(choice, i) in poll.choices" :key="i" :class="$style.choice" @click="vote(i)">
			<div :class="$style.bg" :style="{ 'width': `${showResult ? (choice.votes / total * 100) : 0}%` }"></div>
			<span :class="$style.fg">
				<template v-if="choice.isVoted"><i class="ti ti-check" style="margin-right: 4px; color: var(--MI_THEME-accent);"></i></template>
				<Mfm :text="choice.text" :plain="true"/>
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
import { computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import type { OpenOnRemoteOptions } from '@/scripts/please-login.js';
import { sum } from '@/scripts/array.js';
import { pleaseLogin } from '@/scripts/please-login.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { host } from '@@/js/config.js';
import { useInterval } from '@@/js/use-interval.js';

const props = defineProps<{
	noteId: string;
	poll: NonNullable<Misskey.entities.Note['poll']>;
	readOnly?: boolean;
}>();

const remaining = ref(-1);

const total = computed(() => sum(props.poll.choices.map(x => x.votes)));
const closed = computed(() => remaining.value === 0);
const isVoted = computed(() => !props.poll.multiple && props.poll.choices.some(c => c.isVoted));
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

const showResult = ref(props.readOnly || isVoted.value);

const pleaseLoginContext = computed<OpenOnRemoteOptions>(() => ({
	type: 'lookup',
	url: `https://${host}/notes/${props.noteId}`,
}));

// 期限付きアンケート
if (props.poll.expiresAt) {
	const tick = () => {
		remaining.value = Math.floor(Math.max(new Date(props.poll.expiresAt!).getTime() - Date.now(), 0) / 1000);
		if (remaining.value === 0) {
			showResult.value = true;
		}
	};

	useInterval(tick, 3000, {
		immediate: true,
		afterMounted: false,
	});
}

const vote = async (id) => {
	if (props.readOnly || closed.value || isVoted.value) return;

	pleaseLogin(undefined, pleaseLoginContext.value);

	const { canceled } = await os.confirm({
		type: 'question',
		text: i18n.tsx.voteConfirm({ choice: props.poll.choices[id].text }),
	});
	if (canceled) return;

	await misskeyApi('notes/polls/vote', {
		noteId: props.noteId,
		choice: id,
	});
	if (!showResult.value) showResult.value = !props.poll.multiple;
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
