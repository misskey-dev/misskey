<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<ul :class="$style.choices">
		<li v-for="(choice, i) in poll.choices" :key="i" :class="$style.choice">
			<div :class="$style.bg" :style="{ 'width': `${choice.votes / total * 100}%` }"></div>
			<span :class="$style.fg">
				<template v-if="choice.isVoted"><i class="ti ti-check" style="margin-right: 4px; color: var(--accent);"></i></template>
				<EmMfm :text="choice.text" :plain="true"/>
				<span style="margin-left: 4px; opacity: 0.7;">({{ i18n.tsx._poll.votesCount({ n: choice.votes }) }})</span>
			</span>
		</li>
	</ul>
	<p :class="$style.info">
		<span>{{ i18n.tsx._poll.totalVotes({ n: total }) }}</span>
	</p>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';
import EmMfm from '@/components/EmMfm.js';

function sum(xs: number[]): number {
	return xs.reduce((a, b) => a + b, 0);
}

const props = defineProps<{
	noteId: string;
	poll: NonNullable<Misskey.entities.Note['poll']>;
}>();

const total = computed(() => sum(props.poll.choices.map(x => x.votes)));
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
	//border: solid 0.5px var(--divider);
	background: var(--accentedBg);
	border-radius: 4px;
	overflow: clip;
}

.bg {
	position: absolute;
	top: 0;
	left: 0;
	height: 100%;
	background: var(--accent);
	background: linear-gradient(90deg,var(--buttonGradateA),var(--buttonGradateB));
	transition: width 1s ease;
}

.fg {
	position: relative;
	display: inline-block;
	padding: 3px 5px;
	background: var(--panel);
	border-radius: 3px;
}

.info {
	color: var(--fg);
}
</style>
