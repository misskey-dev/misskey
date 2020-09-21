<template>
<div class="mk-note-page">
	<portal to="header" v-if="note">
		<MkAvatar class="avatar" :user="note.user" :disable-preview="true"/>
		<mfm 
			:text="$t('noteOf', { user: note.user.name || note.user.username })"
			:plain="true" :nowrap="true" :custom-emojis="note.user.emojis" :is-note="false"
		/>
	</portal>

	<div v-if="note">
		<button class="_panel _button" v-if="hasNext && !showNext" @click="showNext = true" style="margin: 0 auto var(--margin) auto;"><Fa :icon="faChevronUp"/></button>
		<XNotes v-if="showNext" ref="next" :pagination="next"/>
		<hr v-if="showNext"/>

		<MkRemoteCaution v-if="note.user.host != null" :href="note.url || note.uri" style="margin-bottom: var(--margin)"/>
		<XNote v-model:value="note" :key="note.id" :detail="true"/>

		<button class="_panel _button" v-if="hasPrev && !showPrev" @click="showPrev = true" style="margin: var(--margin) auto 0 auto;"><Fa :icon="faChevronDown"/></button>
		<hr v-if="showPrev"/>
		<XNotes v-if="showPrev" ref="prev" :pagination="prev" style="margin-top: var(--margin);"/>
	</div>

	<div v-if="error">
		<MkError @retry="fetch()"/>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import Progress from '@/scripts/loading';
import XNote from '@/components/note.vue';
import XNotes from '@/components/notes.vue';
import MkRemoteCaution from '@/components/remote-caution.vue';
import * as os from '@/os';

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
			os.api('notes/show', {
				noteId: this.$route.params.note
			}).then(note => {
				Promise.all([
					os.api('users/notes', {
						userId: note.userId,
						untilId: note.id,
						limit: 1,
					}),
					os.api('users/notes', {
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
