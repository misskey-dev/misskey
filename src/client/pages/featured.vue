<template>
<div>
	<portal to="header"><Fa :icon="faFireAlt"/>{{ $t('featured') }}</portal>
	<XNotes ref="notes" :pagination="pagination" @before="before" @after="after"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faFireAlt } from '@fortawesome/free-solid-svg-icons';
import Progress from '@/scripts/loading';
import XNotes from '@/components/notes.vue';
import * as os from '@/os';

export default defineComponent({
	metaInfo() {
		return {
			title: this.$t('featured') as string
		};
	},

	components: {
		XNotes
	},

	data() {
		return {
			pagination: {
				endpoint: 'notes/featured',
				limit: 10,
				offsetMode: true
			},
			faFireAlt
		};
	},

	methods: {
		before() {
			Progress.start();
		},

		after() {
			Progress.done();
		}
	}
});
</script>
