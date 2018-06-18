<template>
<mk-ui>
	<mk-home :mode="mode" @loaded="loaded"/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	props: {
		mode: {
			type: String,
			default: 'timeline'
		}
	},
	mounted() {
		document.title = 'Misskey';

		Progress.start();
	},
	methods: {
		loaded() {
			Progress.done();
		}
	}
});
</script>
