<template>
<transition-group v-if="$store.state.device.animation"
	class="uupnnhew"
	name="staggered"
	tag="div"
	appear
>
	<slot></slot>
</transition-group>
<div v-else>
	<slot></slot>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	methods: {
		focus() {
			this.$slots.default[0].elm.focus();
		}
	},
});
</script>

<style lang="scss">
.uupnnhew {
	> .staggered-enter {
		opacity: 0;
		transform: translateY(-64px);
	}

	@for $i from 1 through 30 {
		> .staggered-enter-active:nth-child(#{$i}) {
			transition: transform 0.7s cubic-bezier(0.23, 1, 0.32, 1) (15ms * ($i - 1)), opacity 0.7s cubic-bezier(0.23, 1, 0.32, 1) (15ms * ($i - 1));
		}
	}
}
</style>
