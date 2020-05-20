<template>
<div class="wrpstxzv" :class="{ children }" v-size="[{ max: 450 }]">
	<div class="main">
		<mk-avatar class="avatar" :user="note.user"/>
		<div class="body">
			<x-note-header class="header" :note="note" :mini="true"/>
			<div class="body">
				<p v-if="note.cw != null" class="cw">
					<mfm v-if="note.cw != ''" class="text" :text="note.cw" :author="note.user" :i="$store.state.i" :custom-emojis="note.emojis" />
					<x-cw-button v-model="showContent" :note="note"/>
				</p>
				<div class="content" v-show="note.cw == null || showContent">
					<x-sub-note-content class="text" :note="note"/>
				</div>
			</div>
		</div>
	</div>
	<x-sub v-for="reply in replies" :key="reply.id" :note="reply" class="reply" :detail="true" :children="true"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XNoteHeader from './note-header.vue';
import XSubNoteContent from './sub-note-content.vue';
import XCwButton from './cw-button.vue';

export default Vue.extend({
	name: 'x-sub',

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
			this.$root.api('notes/children', {
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

	> .reply {
		border-left: solid 1px var(--divider);
		margin-top: 10px;
	}
}
</style>
