<template>
<div v-size="{ max: [450] }" class="wrpstxzv" :class="{ children: depth > 1 }">
	<div class="main">
		<MkAvatar class="avatar" :user="note.user"/>
		<div class="body">
			<XNoteHeader class="header" :note="note" :mini="true"/>
			<div class="body">
				<p v-if="note.cw != null" class="cw">
					<Mfm v-if="note.cw != ''" class="text" :text="note.cw" :author="note.user" :i="$i" :custom-emojis="note.emojis" />
					<XCwButton v-model="showContent" :note="note"/>
				</p>
				<div v-show="note.cw == null || showContent" class="content">
					<XSubNote-content class="text" :note="note"/>
				</div>
			</div>
		</div>
	</div>
	<template v-if="depth < 5">
		<XSub v-for="reply in replies" :key="reply.id" :note="reply" class="reply" :detail="true" :depth="depth + 1"/>
	</template>
	<div v-else class="more">
		<MkA class="text _link" :to="notePage(note)">{{ $ts.continueThread }} <i class="fas fa-angle-double-right"></i></MkA>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import notePage from '@/filters/note';
import XNoteHeader from './note-header.vue';
import XSubNoteContent from './sub-note-content.vue';
import XCwButton from './cw-button.vue';
import * as os from '@/os';

export default defineComponent({
	name: 'XSub',

	components: {
		XNoteHeader,
		XSubNoteContent,
		XCwButton,
	},

	props: {
		note: {
			type: Object,
			required: true
		},
		detail: {
			type: Boolean,
			required: false,
			default: false
		},
		// how many notes are in between this one and the note being viewed in detail
		depth: {
			type: Number,
			required: false,
			default: 1
		},
	},

	data() {
		return {
			showContent: false,
			replies: [],
		};
	},

	created() {
		if (this.detail) {
			os.api('notes/children', {
				noteId: this.note.id,
				limit: 5
			}).then(replies => {
				this.replies = replies;
			});
		}
	},

	methods: {
		notePage,
	}
});
</script>

<style lang="scss" scoped>
.wrpstxzv {
	padding: 16px 32px;
	font-size: 0.9em;

	&.max-width_450px {
		padding: 14px 16px;
	}

	&.children {
		padding: 10px 0 0 16px;
		font-size: 1em;

		&.max-width_450px {
			padding: 10px 0 0 8px;
		}
	}

	> .main {
		display: flex;

		> .avatar {
			flex-shrink: 0;
			display: block;
			margin: 0 8px 0 0;
			width: 38px;
			height: 38px;
			border-radius: 8px;
		}

		> .body {
			flex: 1;
			min-width: 0;

			> .header {
				margin-bottom: 2px;
			}

			> .body {
				> .cw {
					cursor: default;
					display: block;
					margin: 0;
					padding: 0;
					overflow-wrap: break-word;

					> .text {
						margin-right: 8px;
					}
				}

				> .content {
					> .text {
						margin: 0;
						padding: 0;
					}
				}
			}
		}
	}

	> .reply, > .more {
		border-left: solid 0.5px var(--divider);
		margin-top: 10px;
	}

	> .more {
		padding: 10px 0 0 16px;
	}
}
</style>
