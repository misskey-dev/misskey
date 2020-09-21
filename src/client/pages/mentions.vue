<template>
<div>
	<portal to="header"><Fa :icon="faAt"/>{{ $t('mentions') }}</portal>
	<XNotes :pagination="pagination" @before="before()" @after="after()"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faAt } from '@fortawesome/free-solid-svg-icons';
import Progress from '@/scripts/loading';
import XNotes from '@/components/notes.vue';
import * as os from '@/os';

export default defineComponent({
	metaInfo() {
		return {
			title: this.$t('mentions') as string
		};
	},

	components: {
		XNotes
	},

	data() {
		return {
			pagination: {
				endpoint: 'notes/mentions',
				limit: 10,
			},
			faAt
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
