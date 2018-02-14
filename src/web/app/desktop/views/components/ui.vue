<template>
<div>
	<mk-ui-header/>
	<div class="content">
		<slot></slot>
	</div>
	<mk-stream-indicator v-if="$root.$data.os.isSignedIn"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import MkPostFormWindow from './post-form-window.vue';

export default Vue.extend({
	mounted() {
		document.addEventListener('keydown', this.onKeydown);
	},
	beforeDestroy() {
		document.removeEventListener('keydown', this.onKeydown);
	},
	methods: {
		openPostForm() {
			document.body.appendChild(new MkPostFormWindow({
				parent: this
			}).$mount().$el);
		},
		onKeydown(e) {
			if (e.target.tagName == 'INPUT' || e.target.tagName == 'TEXTAREA') return;

			if (e.which == 80 || e.which == 78) { // p or n
				e.preventDefault();
				this.openPostForm();
			}
		}
	}
});
</script>

