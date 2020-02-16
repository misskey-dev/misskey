<template>
<div class="mk-note-page">
	<portal to="avatar" v-if="note"><mk-avatar class="avatar" :user="note.user" :disable-preview="true"/></portal>
	<portal to="title" v-if="note">{{ $t('noteOf', { user: note.user.name }) }}</portal>

	<transition :name="$store.state.device.animation ? 'zoom' : ''" mode="out-in">
		<div v-if="note">
			<mk-button v-if="hasNext && !showNext" @click="showNext = true" primary style="margin: 0 auto var(--margin) auto;"><fa :icon="faChevronUp"/></mk-button>
			<x-notes v-if="showNext" ref="next" :pagination="next"/>
			<hr v-if="showNext"/>

			<x-note :note="note" :key="note.id" :detail="true"/>
			<div v-if="error">
				<mk-error @retry="fetch()"/>
			</div>

			<mk-button v-if="hasPrev && !showPrev" @click="showPrev = true" primary style="margin: var(--margin) auto 0 auto;"><fa :icon="faChevronDown"/></mk-button>
			<hr v-if="showPrev"/>
			<x-notes v-if="showPrev" ref="prev" :pagination="prev" style="margin-top: var(--margin);"/>
		</div>
	</transition>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import i18n from '../i18n';
import Progress from '../scripts/loading';
import XNote from '../components/note.vue';
import XNotes from '../components/notes.vue';
import MkButton from '../components/ui/button.vue';

export default Vue.extend({
	i18n,
	metaInfo() {
		return {
			title: this.$t('note') as string
		};
	},
	components: {
		XNote,
		XNotes,
		MkButton,
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
