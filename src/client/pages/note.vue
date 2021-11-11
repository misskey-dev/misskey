<template>
<MkSpacer :content-max="800">
	<div class="fcuexfpr">
		<transition name="fade" mode="out-in">
			<div v-if="note" class="note">
				<div class="_gap" v-if="showNext">
					<XNotes class="_content" :pagination="next" :no-gap="true"/>
				</div>

				<div class="main _gap">
					<MkButton v-if="!showNext && hasNext" class="load next" @click="showNext = true"><i class="fas fa-chevron-up"></i></MkButton>
					<div class="note _gap">
						<MkRemoteCaution v-if="note.user.host != null" :href="note.url || note.uri" class="_isolated"/>
						<XNoteDetailed v-model:note="note" :key="note.id" class="_isolated note"/>
					</div>
					<div class="_content clips _gap" v-if="clips && clips.length > 0">
						<div class="title">{{ $ts.clip }}</div>
						<MkA v-for="item in clips" :key="item.id" :to="`/clips/${item.id}`" class="item _panel _gap">
							<b>{{ item.name }}</b>
							<div v-if="item.description" class="description">{{ item.description }}</div>
							<div class="user">
								<MkAvatar :user="item.user" class="avatar" :show-indicator="true"/> <MkUserName :user="item.user" :nowrap="false"/>
							</div>
						</MkA>
					</div>
					<MkButton v-if="!showPrev && hasPrev" class="load prev" @click="showPrev = true"><i class="fas fa-chevron-down"></i></MkButton>
				</div>

				<div class="_gap" v-if="showPrev">
					<XNotes class="_content" :pagination="prev" :no-gap="true"/>
				</div>
			</div>
			<MkError v-else-if="error" @retry="fetch()"/>
			<MkLoading v-else/>
		</transition>
	</div>
</MkSpacer>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import XNote from '@client/components/note.vue';
import XNoteDetailed from '@client/components/note-detailed.vue';
import XNotes from '@client/components/notes.vue';
import MkRemoteCaution from '@client/components/remote-caution.vue';
import MkButton from '@client/components/ui/button.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

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
				subtitle: new Date(this.note.createdAt).toLocaleString(),
				avatar: this.note.user,
				path: `/notes/${this.note.id}`,
				share: {
					title: this.$t('noteOf', { user: this.note.user.name }),
					text: this.note.text,
				},
				bg: 'var(--bg)',
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
			this.note = null;
			os.api('notes/show', {
				noteId: this.noteId
			}).then(note => {
				this.note = note;
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
				});
			}).catch(e => {
				this.error = e;
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.fcuexfpr {
	background: var(--bg);

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

			> .note {
				> .note {
					border-radius: var(--radius);
					background: var(--panel);
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
