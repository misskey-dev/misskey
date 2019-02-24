<template>
<x-column>
	<template #header>
		<fa :icon="['far', 'comment-alt']"/><mk-user-name :user="note.user" v-if="note"/>
	</template>

	<div class="rvtscbadixhhbsczoorqoaygovdeecsx" v-if="note">
		<div class="is-remote" v-if="note.user.host != null">
			<details>
				<summary><fa icon="exclamation-triangle"/> {{ $t('@.is-remote-post') }}</summary>
				<a :href="note.url || note.uri" target="_blank">{{ $t('@.view-on-remote') }}</a>
			</details>
		</div>
		<x-note :note="note" :detail="true" :mini="true"/>
	</div>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import XColumn from './deck.column.vue';
import XNotes from './deck.notes.vue';
import XNote from '../components/note.vue';

export default Vue.extend({
	i18n: i18n(),
	components: {
		XColumn,
		XNotes,
		XNote
	},

	data() {
		return {
			note: null,
			fetching: true
		};
	},

	watch: {
		$route: 'fetch'
	},

	created() {
		this.fetch();
	},

	methods: {
		fetch() {
			this.fetching = true;

			this.$root.api('notes/show', {
				noteId: this.$route.params.note
			}).then(note => {
				this.note = note;
				this.fetching = false;
			});
		}
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
