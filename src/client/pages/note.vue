<template>
<div class="mk-note-page">
	<portal to="avatar" v-if="note"><mk-avatar class="avatar" :user="note.user" :disable-preview="true"/></portal>
	<portal to="title" v-if="note">{{ $t('noteOf', { user: note.user.name }) }}</portal>

	<transition name="zoom" mode="out-in">
		<x-note v-if="note" :note="note" :key="note.id" :detail="true"/>
		<div v-else-if="error">
			<mk-error @retry="fetch()"/>
		</div>
	</transition>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../i18n';
import Progress from '../scripts/loading';
import XNote from '../components/note.vue';

export default Vue.extend({
	i18n,
	metaInfo() {
		return {
			title: this.$t('note') as string
		};
	},
	components: {
		XNote
	},
	data() {
		return {
			note: null,
			error: null,
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
				this.note = note;
			}).catch(e => {
				this.error = e;
			}).finally(() => {
				Progress.done();
			});
		}
	}
});
</script>
