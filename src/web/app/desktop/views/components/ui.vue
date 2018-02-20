<template>
<div>
	<x-header/>
	<div class="content">
		<slot></slot>
	</div>
	<mk-stream-indicator v-if="os.isSignedIn"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XHeader from './ui.header.vue';

export default Vue.extend({
	components: {
		XHeader
	},
	mounted() {
		document.addEventListener('keydown', this.onKeydown);
	},
	beforeDestroy() {
		document.removeEventListener('keydown', this.onKeydown);
	},
	methods: {
		onKeydown(e) {
			if (e.target.tagName == 'INPUT' || e.target.tagName == 'TEXTAREA') return;

			if (e.which == 80 || e.which == 78) { // p or n
				e.preventDefault();
				(this as any).apis.post();
			}
		}
	}
});
</script>

