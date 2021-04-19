<template>
<div class="civpbkhh">
	<div v-for="note in notes" class="note">
		<div class="content _panel">
			{{ note.text }}
		</div>
		<XReactionsViewer :note="note" ref="reactionsViewer"/>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XReactionsViewer from '@client/components/reactions-viewer.vue';
import * as os from '@client/os';

export default defineComponent({
	components: {
		XReactionsViewer
	},

	data() {
		return {
			notes: [],
		}
	},

	created() {
		os.api('notes/featured').then(notes => {
			this.notes = notes;
		});
	}
});
</script>

<style lang="scss" scoped>
.civpbkhh {
	text-align: right;

	> .note {
		margin: 16px 0 16px auto;

		> .content {
			padding: 16px;
			margin: 0 0 0 auto;
			max-width: max-content;
			border-radius: 16px;
		}
	}
}
</style>
