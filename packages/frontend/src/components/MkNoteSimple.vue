<template>
<div class="yohlumlk">
	<MkAvatar class="avatar" :user="note.user"/>
	<div class="main">
		<MkNoteHeader class="header" :note="note" :mini="true"/>
		<div class="body">
			<p v-if="note.cw != null" class="cw">
				<Mfm v-if="note.cw != ''" class="text" :text="note.cw" :author="note.user" :i="$i"/>
				<MkCwButton v-model="showContent" :note="note"/>
			</p>
			<div v-show="note.cw == null || showContent" class="content">
				<MkSubNoteContent class="text" :note="note"/>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as misskey from 'misskey-js';
import MkNoteHeader from '@/components/MkNoteHeader.vue';
import MkSubNoteContent from '@/components/MkSubNoteContent.vue';
import MkCwButton from '@/components/MkCwButton.vue';

const props = defineProps<{
	note: misskey.entities.Note;
	pinned?: boolean;
}>();

const showContent = $ref(false);
</script>

<style lang="scss" scoped>
.yohlumlk {
	display: flex;
	margin: 0;
	padding: 0;
	overflow: clip;
	font-size: 0.95em;

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

@container (min-width: 350px) {
	.yohlumlk {
		> .avatar {
			margin: 0 10px 0 0;
			width: 44px;
			height: 44px;
		}
	}
}

@container (min-width: 500px) {
	.yohlumlk {
		> .avatar {
			margin: 0 12px 0 0;
			width: 48px;
			height: 48px;
		}
	}
}
</style>
