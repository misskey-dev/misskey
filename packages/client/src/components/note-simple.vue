<template>
<div v-size="{ min: [350, 500] }" class="yohlumlk">
	<MkAvatar class="avatar" :user="note.user"/>
	<div class="main">
		<XNoteHeader class="header" :note="note" :mini="true"/>
		<div class="body">
			<p v-if="note.cw != null" class="cw">
				<span v-if="note.cw != ''" class="text">{{ note.cw }}</span>
				<XCwButton v-model="showContent" :note="note"/>
			</p>
			<div v-show="note.cw == null || showContent" class="content">
				<XSubNote-content class="text" :note="note"/>
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
import * as os from '@/os';

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
	overflow: clip;
	font-size: 0.95em;

	&.min-width_350px {
		> .avatar {
			margin: 0 10px 0 0;
			width: 44px;
			height: 44px;
		}
	}

	&.min-width_500px {
		> .avatar {
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
