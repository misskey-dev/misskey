<template>
<transition-group v-if="$store.state.device.animation"
	class="uupnnhew"
	:data-direction="direction"
	:data-reversed="reversed ? 'true' : 'false'"
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
	props: {
		delay: {
			type: Number,
			required: false,
			default: 40
		},
		direction: {
			type: String,
			required: false,
			default: 'down'
		},
		reversed: {
			type: Boolean,
			required: false,
			default: false
		}
	},
	methods: {
		focus() {
			this.$slots.default[0].elm.focus();
		}
	},
});
</script>

<style lang="scss">
.staggered-move {
	transition: all 0.7s cubic-bezier(0.23, 1, 0.32, 1) !important;
}

.uupnnhew[data-direction="up"] {
	.staggered-enter {
		opacity: 0;
		transform: translateY(64px);
	}
}

.uupnnhew[data-direction="down"] {
	.staggered-enter {
		opacity: 0;
		transform: translateY(-64px);
	}
}

.uupnnhew[data-reversed="true"] {
	@for $i from 1 through 30 {
		.staggered-enter-active:nth-last-child(#{$i}) {
			transition: all 0.7s cubic-bezier(0.23, 1, 0.32, 1) (15ms * ($i - 1));
		}
	}
}

.uupnnhew[data-reversed="false"] {
	@for $i from 1 through 30 {
		.staggered-enter-active:nth-child(#{$i}) {
			transition: all 0.7s cubic-bezier(0.23, 1, 0.32, 1) (15ms * ($i - 1));
		}
	}
}
</style>
