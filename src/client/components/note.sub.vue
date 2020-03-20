<template>
<div class="wrpstxzv">
	<mk-avatar class="avatar" :user="note.user"/>
	<div class="main">
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
</template>

<script lang="ts">
import Vue from 'vue';
import XNoteHeader from './note-header.vue';
import XSubNoteContent from './sub-note-content.vue';
import XCwButton from './cw-button.vue';

export default Vue.extend({
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
		// TODO
		truncate: {
			type: Boolean,
			default: true
		}
	},

	inject: {
		narrow: {
			default: false
		}
	},

	data() {
		return {
			showContent: false
		};
	}
});
</script>

<style lang="scss" scoped>
.wrpstxzv {
	display: flex;
	padding: 16px 32px;
	font-size: 0.9em;

	@media (max-width: 450px) {
		padding: 14px 16px;
	}

	> .avatar {
		flex-shrink: 0;
		display: block;
		margin: 0 8px 0 0;
		width: 38px;
		height: 38px;
		border-radius: 8px;
	}

	> .main {
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
</style>
