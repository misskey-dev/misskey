<template>
<div class="kjeftjfm" v-size="[{ max: 500 }]">
	<div class="with">
		<button class="_button" @click="with_ = null" :class="{ active: with_ === null }">{{ $t('notes') }}</button>
		<button class="_button" @click="with_ = 'replies'" :class="{ active: with_ === 'replies' }">{{ $t('notesAndReplies') }}</button>
		<button class="_button" @click="with_ = 'files'" :class="{ active: with_ === 'files' }">{{ $t('withFiles') }}</button>
	</div>
	<x-notes ref="timeline" :pagination="pagination" @before="$emit('before')" @after="e => $emit('after', e)"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XNotes from '../../components/notes.vue';

export default defineComponent({
	components: {
		XNotes
	},

	props: {
		user: {
			type: Object,
			required: true,
		},
	},

	watch: {
		user() {
			this.$refs.timeline.reload();
		},

		with_() {
			this.$refs.timeline.reload();
		},
	},

	data() {
		return {
			date: null,
			with_: null,
			pagination: {
				endpoint: 'users/notes',
				limit: 10,
				params: init => ({
					userId: this.user.id,
					includeReplies: this.with_ === 'replies',
					withFiles: this.with_ === 'files',
					untilDate: init ? undefined : (this.date ? this.date.getTime() : undefined),
				})
			}
		};
	},
});
</script>

<style lang="scss" scoped>
.kjeftjfm {
	> .with {
		display: flex;
		margin-bottom: var(--margin);

		> button {
			flex: 1;
			padding: 11px 8px 8px 8px;
			border-bottom: solid 3px transparent;

			&.active {
				color: var(--accent);
				border-bottom-color: var(--accent);
			}
		}
	}

	&.max-width_500px {
		> .with {
			font-size: 80%;
		}
	}
}
</style>
