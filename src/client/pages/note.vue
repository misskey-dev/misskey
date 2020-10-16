<template>
<div class="fcuexfpr">
	<div v-if="note" class="note">
		<div class="_section">
			<XNotes v-if="showNext" class="_content" :pagination="next"/>
			<MkButton v-else-if="hasNext" class="load _content" @click="showNext = true"><Fa :icon="faChevronUp"/></MkButton>
		</div>

		<div class="_section">
			<div class="_content">
				<MkRemoteCaution v-if="note.user.host != null" :href="note.url || note.uri" style="margin-bottom: var(--margin)"/>
				<XNote v-model:note="note" :key="note.id" :detail="true"/>
			</div>
		</div>

		<div class="_section">
			<XNotes v-if="showPrev" class="_content" :pagination="prev"/>
			<MkButton v-else-if="hasPrev" class="load _content" @click="showPrev = true"><Fa :icon="faChevronDown"/></MkButton>
		</div>
	</div>

	<div v-if="error">
		<MkError @retry="fetch()"/>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import Progress from '@/scripts/loading';
import XNote from '@/components/note.vue';
import XNotes from '@/components/notes.vue';
import MkRemoteCaution from '@/components/remote-caution.vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XNote,
		XNotes,
		MkRemoteCaution,
		MkButton,
	},
	data() {
		return {
			INFO: computed(() => this.note ? {
				header: [{
					title: this.$t('note'),
					avatar: this.note.user,
				}],
			} : null),
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

<style lang="scss" scoped>
.fcuexfpr {
	> .note {
		> ._section {
			> .load {
				min-width: 0;
				border-radius: 999px;
			}
		}
	}
}
</style>
