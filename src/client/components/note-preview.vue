<template>
<div class="yohlumlk">
	<mk-avatar class="avatar" :user="note.user"/>
	<div class="main">
		<x-note-header class="header" :note="note" :mini="true"/>
		<div class="body">
			<p v-if="note.cw != null" class="cw">
				<span class="text" v-if="note.cw != ''">{{ note.cw }}</span>
				<x-cw-button v-model:value="showContent" :note="note"/>
			</p>
			<div class="content" v-show="note.cw == null || showContent">
				<x-sub-note-content class="text" :note="note"/>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XNoteHeader from './note-header.vue';
import XSubNoteContent from './sub-note-content.vue';
import XCwButton from './cw-button.vue';

export default defineComponent({
	components: {
		XNoteHeader,
		XSubNoteContent,
		XCwButton,
	},

	props: {
		note: {
			type: Object,
			required: true
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
.yohlumlk {
	display: flex;
	margin: 0;
	padding: 0;
	overflow: hidden;
	font-size: 0.95em;

	> .avatar {

		@media (min-width: 350px) {
			margin: 0 10px 0 0;
			width: 44px;
			height: 44px;
		}

		@media (min-width: 500px) {
			margin: 0 12px 0 0;
			width: 48px;
			height: 48px;
		}
	}

	> .avatar {
		flex-shrink: 0;
		display: block;
		margin: 0 10px 0 0;
		width: 40px;
		height: 40px;
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
					cursor: default;
					margin: 0;
					padding: 0;
				}
			}
		}
	}
}
</style>
