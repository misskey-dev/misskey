<template>
<mk-ui>
	<mk-home :mode="mode" @loaded="loaded"/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';
import * as config from '../../../config';

export default Vue.extend({
	props: {
		mode: {
			type: String,
			default: 'timeline'
		}
	},
	mounted() {
		document.title = config.name;

		Progress.start();
	},
	methods: {
		loaded() {
			Progress.done();
		}
	}
});
</script>
