<template>
<button
	class="hkzvhatu _button"
	:class="{ reacted: note.myReaction == reaction, canToggle }"
	@click="toggleReaction(reaction)"
	v-if="count > 0"
	@touchstart="onMouseover"
	@mouseover="onMouseover"
	@mouseleave="onMouseleave"
	@touchend="onMouseleave"
	ref="reaction"
	v-particle="canToggle"
>
	<XReactionIcon :reaction="reaction" :custom-emojis="note.emojis" ref="icon"/>
	<span>{{ count }}</span>
</button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XDetails from './reactions-viewer.details.vue';
import XReactionIcon from './reaction-icon.vue';
import * as os from '@/os';

export default defineComponent({
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
		canToggle(): boolean {
			return !this.reaction.match(/@\w/) && this.$store.getters.isSignedIn;
		},
	},
	watch: {
		count(newCount, oldCount) {
			if (oldCount < newCount) this.anime();
			if (this.details != null) this.openDetails();
		},
	},
	mounted() {
		if (!this.isInitial) this.anime();
	},
	methods: {
		toggleReaction() {
			if (!this.canToggle) return;

			const oldReaction = this.note.myReaction;
			if (oldReaction) {
				os.api('notes/reactions/delete', {
					noteId: this.note.id
				}).then(() => {
					if (oldReaction !== this.reaction) {
						os.api('notes/reactions/create', {
							noteId: this.note.id,
							reaction: this.reaction
						});
					}
				});
			} else {
				os.api('notes/reactions/create', {
					noteId: this.note.id,
					reaction: this.reaction
				});
			}
		},
		onMouseover() {
			if (this.isHovering) return;
			this.isHovering = true;
			this.detailsTimeoutId = setTimeout(this.openDetails, 300);
		},
		onMouseleave() {
			if (!this.isHovering) return;
			this.isHovering = false;
			clearTimeout(this.detailsTimeoutId);
			this.closeDetails();
		},
		openDetails() {
			os.api('notes/reactions', {
				noteId: this.note.id,
				type: this.reaction,
				limit: 11
			}).then((reactions: any[]) => {
				const users = reactions
					.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
					.map(x => x.user);

				this.closeDetails();
				if (!this.isHovering) return;
				this.details = os.modal(XDetails, {
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

		&:hover {
			background: var(--accent);
		}

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
