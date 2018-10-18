<template>
<x-column>
	<span slot="header">
		%fa:comment-alt R%<span>{{ title }}</span>
	</span>

	<div class="rvtscbadixhhbsczoorqoaygovdeecsx" v-if="note">
		<div class="is-remote" v-if="note.user.host != null">%fa:exclamation-triangle% %i18n:@is-remote%<a :href="note.url || note.uri" target="_blank">%i18n:@view-remote%</a></div>
		<x-note :note="note" :detail="true" :mini="true"/>
	</div>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import XColumn from './deck.column.vue';
import XNotes from './deck.notes.vue';
import XNote from '../../components/note.vue';

export default Vue.extend({
	components: {
		XColumn,
		XNotes,
		XNote
	},

	props: {
		noteId: {
			type: String,
			required: true
		}
	},

	data() {
		return {
			note: null,
			fetching: true
		};
	},

	computed: {
		title(): string {
			return this.note ? Vue.filter('userName')(this.note.user) : '';
		}
	},

	created() {
		(this as any).api('notes/show', { noteId: this.noteId }).then(note => {
			this.note = note;
			this.fetching = false;
		});
	}
});
</script>

<style lang="stylus" scoped>
.rvtscbadixhhbsczoorqoaygovdeecsx
	> .is-remote
		padding 8px 16px
		font-size 12px

		&.is-remote
			color var(--remoteInfoFg)
			background var(--remoteInfoBg)

		> a
			font-weight bold

</style>
