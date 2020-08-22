<template>
<div class="mk-note-page">
	<teleport to="#_teleport_header" v-if="note">
		<mk-avatar class="avatar" :user="note.user" :disable-preview="true"/>
		<mfm 
			:text="$t('noteOf', { user: note.user.name || note.user.username })"
			:plain="true" :nowrap="true" :custom-emojis="note.user.emojis" :is-note="false"
		/>
	</teleport>

	<div v-if="note">
		<button class="_panel _button" v-if="hasNext && !showNext" @click="showNext = true" style="margin: 0 auto var(--margin) auto;"><fa :icon="faChevronUp"/></button>
		<x-notes v-if="showNext" ref="next" :pagination="next"/>
		<hr v-if="showNext"/>

		<mk-remote-caution v-if="note.user.host != null" :href="note.url || note.uri" style="margin-bottom: var(--margin)"/>
		<x-note v-model="note" :key="note.id" :detail="true"/>

		<button class="_panel _button" v-if="hasPrev && !showPrev" @click="showPrev = true" style="margin: var(--margin) auto 0 auto;"><fa :icon="faChevronDown"/></button>
		<hr v-if="showPrev"/>
		<x-notes v-if="showPrev" ref="prev" :pagination="prev" style="margin-top: var(--margin);"/>
	</div>

	<div v-if="error">
		<mk-error @retry="fetch()"/>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import Progress from '../scripts/loading';
import XNote from '../components/note.vue';
import XNotes from '../components/notes.vue';
import MkRemoteCaution from '../components/remote-caution.vue';

export default defineComponent({
	metaInfo() {
		return {
			title: this.$t('note') as string
		};
	},
	components: {
		XNote,
		XNotes,
		MkRemoteCaution,
	},
	data() {
		return {
			note: null,
			hasPrev: false,
			hasNext: false,
			showPrev: false,
			showNext: false,
			error: null,
			prev: {
				endpoint: 'users/notes',
				limit: 10,
				params: init => ({
					userId: this.note.userId,
					untilId: this.note.id,
				})
			},
			next: {
				reversed: true,
				endpoint: 'users/notes',
				limit: 10,
				params: init => ({
					userId: this.note.userId,
					sinceId: this.note.id,
				})
			},
			faChevronUp, faChevronDown
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
			Progress.start();
			this.$root.api('notes/show', {
				noteId: this.$route.params.note
			}).then(note => {
				Promise.all([
					this.$root.api('users/notes', {
						userId: note.userId,
						untilId: note.id,
						limit: 1,
					}),
					this.$root.api('users/notes', {
						userId: note.userId,
						sinceId: note.id,
						limit: 1,
					}),
				]).then(([prev, next]) => {
					this.hasPrev = prev.length !== 0;
					this.hasNext = next.length !== 0;
					this.note = note;
				});
			}).catch(e => {
				this.error = e;
			}).finally(() => {
				Progress.done();
			});
		}
	}
});
</script>
