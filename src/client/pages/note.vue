<template>
<div class="fcuexfpr _root">
	<div v-if="note" class="note" v-anim>
		<div class="_vMargin" v-if="showNext">
			<XNotes class="_content _noGap_" :pagination="next"/>
		</div>

		<div class="main _vMargin">
			<MkButton v-if="!showNext && hasNext" class="load next" @click="showNext = true"><Fa :icon="faChevronUp"/></MkButton>
			<div class="_content _vMargin">
				<MkRemoteCaution v-if="note.user.host != null" :href="note.url || note.uri" class="_vMargin"/>
				<XNoteDetailed v-model:note="note" :key="note.id" class="_vMargin"/>
			</div>
			<div class="_content clips _vMargin" v-if="clips && clips.length > 0">
				<div class="title">{{ $ts.clip }}</div>
				<MkA v-for="item in clips" :key="item.id" :to="`/clips/${item.id}`" class="item _panel _vMargin">
					<b>{{ item.name }}</b>
					<div v-if="item.description" class="description">{{ item.description }}</div>
					<div class="user">
						<MkAvatar :user="item.user" class="avatar"/> <MkUserName :user="item.user" :nowrap="false"/>
					</div>
				</MkA>
			</div>
			<MkButton v-if="!showPrev && hasPrev" class="load prev" @click="showPrev = true"><Fa :icon="faChevronDown"/></MkButton>
		</div>

		<div class="_vMargin" v-if="showPrev">
			<XNotes class="_content _noGap_" :pagination="prev"/>
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
import XNote from '@client/components/note.vue';
import XNoteDetailed from '@client/components/note-detailed.vue';
import XNotes from '@client/components/notes.vue';
import MkRemoteCaution from '@client/components/remote-caution.vue';
import MkButton from '@client/components/ui/button.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';
import { url } from '@client/config';

export default defineComponent({
	components: {
		XNote,
		XNoteDetailed,
		XNotes,
		MkRemoteCaution,
		MkButton,
	},
	props: {
		noteId: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			[symbols.PAGE_INFO]: computed(() => this.note ? {
				title: this.$ts.note,
				avatar: this.note.user,
				share: {
					title: this.$t('noteOf', { user: this.note.user.name }),
					text: this.note.text,
					url: `${url}/notes/${this.note.id}`
				},
			} : null),
			note: null,
			clips: null,
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
		noteId: 'fetch'
	},
	created() {
		this.fetch();
	},
	methods: {
		fetch() {
			os.api('notes/show', {
				noteId: this.noteId
			}).then(note => {
				Promise.all([
					os.api('notes/clips', {
						noteId: note.id,
					}),
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
				]).then(([clips, prev, next]) => {
					this.clips = clips;
					this.hasPrev = prev.length !== 0;
					this.hasNext = next.length !== 0;
					this.note = note;
				});
			}).catch(e => {
				this.error = e;
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.fcuexfpr {
	> .note {
		> .main {
			> .load {
				min-width: 0;
				margin: 0 auto;
				border-radius: 999px;

				&.next {
					margin-bottom: var(--margin);
				}

				&.prev {
					margin-top: var(--margin);
				}
			}

			> .clips {
				> .title {
					font-weight: bold;
					padding: 12px;
				}

				> .item {
					display: block;
					padding: 16px;

					> .description {
						padding: 8px 0;
					}

					> .user {
						$height: 32px;
						padding-top: 16px;
						border-top: solid 0.5px var(--divider);
						line-height: $height;

						> .avatar {
							width: $height;
							height: $height;
						}
					}
				}
			}
		}
	}
}
</style>
