<template>
<div class="mk-note-page">
	<portal to="header" v-if="note">
		<MkAvatar class="avatar" :user="note.user" :disable-preview="true"/>
		<Mfm 
			:text="$t('noteOf', { user: note.user.name || note.user.username })"
			:plain="true" :nowrap="true" :custom-emojis="note.user.emojis" :is-note="false"
		/>
	</portal>

	<div v-if="note">
		<button class="_panel _button" v-if="hasNext && !showNext" @click="showNext = true"><Fa :icon="faChevronUp"/></button>

		<div class="_section" v-if="showNext">
			<XNotes class="_content" ref="next" :pagination="next"/>
		</div>

		<div class="_section">
			<div class="_content">
				<MkRemoteCaution v-if="note.user.host != null" :href="note.url || note.uri" style="margin-bottom: var(--margin)"/>
				<XNote v-model:note="note" :key="note.id" :detail="true"/>
			</div>
		</div>

		<div class="_section" v-if="showPrev">
			<XNotes class="_content" ref="prev" :pagination="prev"/>
		</div>

		<button class="_panel _button" v-if="hasPrev && !showPrev" @click="showPrev = true"><Fa :icon="faChevronDown"/></button>
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
