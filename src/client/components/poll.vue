<template>
<div class="tivcixzd" :data-done="closed || isVoted">
	<ul>
		<li v-for="(choice, i) in poll.choices" :key="i" @click="vote(i)" :class="{ voted: choice.voted }">
			<div class="backdrop" :style="{ 'width': `${showResult ? (choice.votes / total * 100) : 0}%` }"></div>
			<span>
				<template v-if="choice.isVoted"><fa :icon="faCheck"/></template>
				<mfm :text="choice.text" :plain="true" :custom-emojis="note.emojis"/>
				<span class="votes" v-if="showResult">({{ $t('_poll.votesCount', { n: choice.votes }) }})</span>
			</span>
		</li>
	</ul>
	<p>
		<span>{{ $t('_poll.totalVotes', { n: total }) }}</span>
		<span> · </span>
		<a v-if="!closed && !isVoted" @click="toggleShowResult">{{ showResult ? $t('_poll.vote') : $t('_poll.showResult') }}</a>
		<span v-if="isVoted">{{ $t('_poll.voted') }}</span>
		<span v-else-if="closed">{{ $t('_poll.closed') }}</span>
		<span v-if="remaining > 0"> · {{ timer }}</span>
	</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import i18n from '../i18n';
import { sum } from '../../prelude/array';

export default Vue.extend({
	i18n,
	props: {
		note: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			remaining: -1,
			showResult: false,
			faCheck
		};
	},
	computed: {
		poll(): any {
			return this.note.poll;
		},
		total(): number {
			return sum(this.poll.choices.map(x => x.votes));
		},
		closed(): boolean {
			return !this.remaining;
		},
		timer(): string {
			return this.$t(
				this.remaining > 86400 ? '_poll.remainingDays' :
				this.remaining > 3600 ? '_poll.remainingHours' :
				this.remaining > 60 ? '_poll.remainingMinutes' : '_poll.remainingSeconds', {
					s: Math.floor(this.remaining % 60),
					m: Math.floor(this.remaining / 60) % 60,
					h: Math.floor(this.remaining / 3600) % 24,
					d: Math.floor(this.remaining / 86400)
				});
		},
		isVoted(): boolean {
			return !this.poll.multiple && this.poll.choices.some(c => c.isVoted);
		}
	},
	created() {
		this.showResult = this.isVoted;

		if (this.note.poll.expiresAt) {
			const update = () => {
				if (this.remaining = Math.floor(Math.max(new Date(this.note.poll.expiresAt).getTime() - Date.now(), 0) / 1000))
					requestAnimationFrame(update);
				else
					this.showResult = true;
			};

			update();
		}
	},
	methods: {
		toggleShowResult() {
			this.showResult = !this.showResult;
		},
		vote(id) {
			if (this.closed || !this.poll.multiple && this.poll.choices.some(c => c.isVoted)) return;
			this.$root.api('notes/polls/vote', {
				noteId: this.note.id,
				choice: id
			}).then(() => {
				if (!this.showResult) this.showResult = !this.poll.multiple;
			});
		}
	}
});
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
			padding: 4px 8px;
			width: 100%;
			border: solid 1px var(--divider);
			border-radius: 4px;
			overflow: hidden;
			cursor: pointer;

			&:hover {
				background: rgba(#000, 0.05);
			}

			&:active {
				background: rgba(#000, 0.1);
			}

			> .backdrop {
				position: absolute;
				top: 0;
				left: 0;
				height: 100%;
				background: var(--accent);
				transition: width 1s ease;
			}

			> span {
				position: relative;

				> [data-icon] {
					margin-right: 4px;
				}

				> .votes {
					margin-left: 4px;
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

	&[data-done] {
		> ul > li {
			cursor: default;

			&:hover {
				background: transparent;
			}

			&:active {
				background: transparent;
			}
		}
	}
}
</style>
