<template>
<button
	class="hkzvhatu _button"
	:class="{ reacted: note.myReaction == reaction, canToggle }"
	@click="toggleReaction(reaction)"
	v-if="count > 0"
	@mouseover="onMouseover"
	@mouseleave="onMouseleave"
	ref="reaction"
	v-particle
>
	<x-reaction-icon :reaction="reaction" :customEmojis="note.emojis" ref="icon"/>
	<span>{{ count }}</span>
</button>
</template>

<script lang="ts">
import Vue from 'vue';
import XDetails from './reactions-viewer.details.vue';
import XReactionIcon from './reaction-icon.vue';

export default Vue.extend({
	components: {
		XReactionIcon
	},
	props: {
		reaction: {
			type: String,
			required: true,
		},
		count: {
			type: Number,
			required: true,
		},
		isInitial: {
			type: Boolean,
			required: true,
		},
		note: {
			type: Object,
			required: true,
		},
	},
	data() {
		return {
			details: null,
			detailsTimeoutId: null,
			isHovering: false
		};
	},
	computed: {
		isMe(): boolean {
			return this.$store.getters.isSignedIn && this.$store.state.i.id === this.note.userId;
		},
		canToggle(): boolean {
			return !this.reaction.match(/@\w/);
		},
	},
	mounted() {
		if (!this.isInitial) this.anime();
	},
	watch: {
		count(newCount, oldCount) {
			if (oldCount < newCount) this.anime();
			if (this.details != null) this.openDetails();
		},
	},
	methods: {
		toggleReaction() {
			if (this.isMe) return;
			if (!this.canToggle) return;

			const oldReaction = this.note.myReaction;
			if (oldReaction) {
				this.$root.api('notes/reactions/delete', {
					noteId: this.note.id
				}).then(() => {
					if (oldReaction !== this.reaction) {
						this.$root.api('notes/reactions/create', {
							noteId: this.note.id,
							reaction: this.reaction
						});
					}
				});
			} else {
				this.$root.api('notes/reactions/create', {
					noteId: this.note.id,
					reaction: this.reaction
				});
			}
		},
		onMouseover() {
			this.isHovering = true;
			this.detailsTimeoutId = setTimeout(this.openDetails, 300);
		},
		onMouseleave() {
			this.isHovering = false;
			clearTimeout(this.detailsTimeoutId);
			this.closeDetails();
		},
		openDetails() {
			if (this.$root.isMobile) return;
			this.$root.api('notes/reactions', {
				noteId: this.note.id,
				type: this.reaction,
				limit: 11
			}).then((reactions: any[]) => {
				const users = reactions
					.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
					.map(x => x.user);

				this.closeDetails();
				if (!this.isHovering) return;
				this.details = this.$root.new(XDetails, {
					reaction: this.reaction,
					users,
					count: this.count,
					source: this.$refs.reaction
				});
			});
		},
		closeDetails() {
			if (this.details != null) {
				this.details.close();
				this.details = null;
			}
		},
		anime() {
			if (document.hidden) return;

			// TODO
		},
	}
});
</script>

<style lang="scss" scoped>
.hkzvhatu {
	display: inline-block;
	height: 32px;
	margin: 2px;
	padding: 0 6px;
	border-radius: 4px;

	&.canToggle {
		background: rgba(0, 0, 0, 0.05);

		&:hover {
			background: rgba(0, 0, 0, 0.1);
		}
	}

	&:not(.canToggle) {
		cursor: default;
	}

	&.reacted {
		background: var(--accent);

		> span {
			color: #fff;
		}
	}

	> span {
		font-size: 0.9em;
		line-height: 32px;
	}
}
</style>
