<template>
<button
	class="button _button canRenote"
	@click="renote()"
	v-if="canRenote"
	@touchstart.passive="onMouseover"
	@mouseover="onMouseover"
	@mouseleave="onMouseleave"
	@touchend="onMouseleave"
	ref="renoteButton"
>
	<i class="fas fa-retweet"></i>
	<p class="count" v-if="count > 0">{{ count }}</p>
</button>
<button
	v-else
	class="button _button"
>
	<i class="fas fa-ban"></i>
</button>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import XDetails from '@client/components/reactions-viewer.details.vue';
import { pleaseLogin } from '@client/scripts/please-login';
import * as os from '@client/os';

export default defineComponent({
	props: {
		count: {
			type: Number,
			required: true,
		},
		note: {
			type: Object,
			required: true,
		},
	},
	data() {
		return {
			close: null,
			detailsTimeoutId: null,
			isHovering: false
		};
	},
	computed: {
		canRenote(): boolean {
			return ['public', 'home'].includes(this.note.visibility) || this.note.userId === this.$i.id;
		},
	},
	watch: {
		count(newCount, oldCount) {
			if (oldCount < newCount) this.anime();
			if (this.close != null) this.openDetails();
		},
	},
	methods: {
		renote(viaKeyboard = false) {
			pleaseLogin();
			os.popupMenu([{
				text: this.$ts.renote,
				icon: 'fas fa-retweet',
				action: () => {
					os.api('notes/create', {
						renoteId: this.note.id
					});
				}
			}, {
				text: this.$ts.quote,
				icon: 'fas fa-quote-right',
				action: () => {
					os.post({
						renote: this.note,
					});
				}
			}], this.$refs.renoteButton, {
				viaKeyboard
			});
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
			os.api('notes/renotes', {
				noteId: this.note.id,
				limit: 11
			}).then((renotes: any[]) => {
				const users = renotes
					.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
					.map(x => x.user);

				this.closeDetails();
				if (!this.isHovering || users.length < 1) return;

				const showing = ref(true);
				os.popup(XDetails, {
					showing,
					reaction: '🔁',
					emojis: [],
					users,
					count: this.count,
					source: this.$refs.renoteButton
				}, {}, 'closed');

				this.close = () => {
					showing.value = false;
				};
			});
		},
		closeDetails() {
			if (this.close != null) {
				this.close();
				this.close = null;
			}
		},
	}
});
</script>

<style lang="scss" scoped>
.button {
	display: inline-block;
	height: 32px;
	margin: 2px;
	padding: 0 6px;
	border-radius: 4px;

	&:not(.canRenote) {
		cursor: default;
	}

	&.renoted {
		background: var(--accent);
	}

	> .count {
		display: inline;
		margin-left: 8px;
		opacity: 0.7;
	}
}
</style>
