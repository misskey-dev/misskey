<template>
<div v-if="meta" class="mk-welcome">
	<div>
		<x-setup v-if="meta.requireSetup"/>
		<x-signin v-else/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XSetup from './index.welcome.setup.vue';
import XSignin from './index.welcome.signin.vue';

export default Vue.extend({
	components: {
		XSetup,
		XSignin,
	},

	data() {
		return {
			meta: null
		}
	},

	created() {
		this.$root.getMeta().then(meta => {
			this.meta = meta;
		});
	}
});
</script>

<style lang="scss" scoped>
.mk-welcome {
	min-height: 80vh;

	> div {
		position: absolute;
		top: 50%;
		right: 0;
		left: 0;
		margin: 0 auto;
		transform: translateY(-50%);
		text-align: center;
		max-width: calc(100% - 16px);

		@media (max-height: 500px) {
			position: relative;
			transform: none;
			max-width: 100%;
		}

		> *:first-child {
			display: inline-block;
		}
	}
}
</style>
