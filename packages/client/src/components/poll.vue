<template>
<div class="tivcixzd" :class="{ done: closed || isVoted }">
	<ul>
		<li v-for="(choice, i) in note.poll.choices" :key="i" :class="{ voted: choice.voted }" @click="vote(i)">
			<div class="backdrop" :style="{ 'width': `${showResult ? (choice.votes / total * 100) : 0}%` }"></div>
			<span>
				<template v-if="choice.isVoted"><i class="fas fa-check"></i></template>
				<Mfm :text="choice.text" :plain="true" :custom-emojis="note.emojis"/>
				<span v-if="showResult" class="votes">({{ $t('_poll.votesCount', { n: choice.votes }) }})</span>
			</span>
		</li>
	</ul>
	<p v-if="!readOnly">
		<span>{{ $t('_poll.totalVotes', { n: total }) }}</span>
		<span> · </span>
		<a v-if="!closed && !isVoted" @click="showResult = !showResult">{{ showResult ? i18n.ts._poll.vote : i18n.ts._poll.showResult }}</a>
		<span v-if="isVoted">{{ i18n.ts._poll.voted }}</span>
		<span v-else-if="closed">{{ i18n.ts._poll.closed }}</span>
		<span v-if="remaining > 0"> · {{ timer }}</span>
	</p>
</div>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref, toRef } from 'vue';
import * as misskey from 'misskey-js';
import { sum } from '@/scripts/array';
import { pleaseLogin } from '@/scripts/please-login';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { useInterval } from '@/scripts/use-interval';

const props = defineProps<{
	note: misskey.entities.Note;
	readOnly?: boolean;
}>();

const remaining = ref(-1);

const total = computed(() => sum(props.note.poll.choices.map(x => x.votes)));
const closed = computed(() => remaining.value === 0);
const isVoted = computed(() => !props.note.poll.multiple && props.note.poll.choices.some(c => c.isVoted));
const timer = computed(() => i18n.t(
	remaining.value >= 86400 ? '_poll.remainingDays' :
	remaining.value >= 3600 ? '_poll.remainingHours' :
	remaining.value >= 60 ? '_poll.remainingMinutes' : '_poll.remainingSeconds', {
		s: Math.floor(remaining.value % 60),
		m: Math.floor(remaining.value / 60) % 60,
		h: Math.floor(remaining.value / 3600) % 24,
		d: Math.floor(remaining.value / 86400),
	}));

const showResult = ref(props.readOnly || isVoted.value);

// 期限付きアンケート
if (props.note.poll.expiresAt) {
	const tick = () => {
		remaining.value = Math.floor(Math.max(new Date(props.note.poll.expiresAt).getTime() - Date.now(), 0) / 1000);
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
	pleaseLogin();

	if (props.readOnly || closed.value || isVoted.value) return;

	const { canceled } = await os.confirm({
		type: 'question',
		text: i18n.t('voteConfirm', { choice: props.note.poll.choices[id].text }),
	});
	if (canceled) return;

	await os.api('notes/polls/vote', {
		noteId: props.note.id,
		choice: id,
	});
	if (!showResult.value) showResult.value = !props.note.poll.multiple;
};
</script>

<style lang="scss" scoped>
.tivcixzd {
	> ul {
		display: block;
		margin: 0;
		padding: 0;
		list-style: none;

		> li {
			display: block;
			position: relative;
			margin: 4px 0;
			padding: 4px;
			//border: solid 0.5px var(--divider);
			background: var(--accentedBg);
			border-radius: 4px;
			overflow: hidden;
			cursor: pointer;

			> .backdrop {
				position: absolute;
				top: 0;
				left: 0;
				height: 100%;
				background: var(--accent);
				background: linear-gradient(90deg,var(--buttonGradateA),var(--buttonGradateB));
				transition: width 1s ease;
			}

			> span {
				position: relative;
				display: inline-block;
				padding: 3px 5px;
				background: var(--panel);
				border-radius: 3px;

				> i {
					margin-right: 4px;
					color: var(--accent);
				}

				> .votes {
					margin-left: 4px;
					opacity: 0.7;
				}
			}
		}
	}

	> p {
		color: var(--fg);

		a {
			color: inherit;
		}
	}

	&.done {
		> ul > li {
			cursor: default;
		}
	}
}
</style>
