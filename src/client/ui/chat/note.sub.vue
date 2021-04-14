<template>
<div class="wrpstxzv" :class="{ children }">
	<div class="main">
		<MkAvatar class="avatar" :user="note.user"/>
		<div class="body">
			<XNoteHeader class="header" :note="note" :mini="true"/>
			<div class="body">
				<p v-if="note.cw != null" class="cw">
					<Mfm v-if="note.cw != ''" class="text" :text="note.cw" :author="note.user" :i="$i" :custom-emojis="note.emojis" />
					<XCwButton v-model:value="showContent" :note="note"/>
				</p>
				<div class="content" v-show="note.cw == null || showContent">
					<XSubNote-content class="text" :note="note"/>
				</div>
			</div>
		</div>
	</div>
	<XSub v-for="reply in replies" :key="reply.id" :note="reply" class="reply" :detail="true" :children="true"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XNoteHeader from './note-header.vue';
import XSubNoteContent from './sub-note-content.vue';
import XCwButton from '@client/components/cw-button.vue';
import * as os from '@client/os';

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
		children: {
			type: Boolean,
			required: false,
			default: false
		},
		// TODO
		truncate: {
			type: Boolean,
			default: true
		}
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
});
</script>

<style lang="scss" scoped>
.wrpstxzv {
	padding: 16px 16px;
	font-size: 0.8em;

	&.children {
		padding: 10px 0 0 16px;
		font-size: 1em;
	}

	> .main {
		display: flex;

		> .avatar {
			flex-shrink: 0;
			display: block;
			margin: 0 8px 0 0;
			width: 36px;
			height: 36px;
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

	> .reply {
		border-left: solid 0.5px var(--divider);
		margin-top: 10px;
	}
}
</style>
