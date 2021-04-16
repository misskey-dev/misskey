<template>
<div class="yxspomdl" :class="{ inline, colored }">
	<div class="ring"></div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@client/os';

export default defineComponent({
	props: {
		inline: {
			type: Boolean,
			required: false,
			default: false
		},
		colored: {
			type: Boolean,
			required: false,
			default: true
		}
	}
});
</script>

<style lang="scss" scoped>
@keyframes ring {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

.yxspomdl {
	padding: 32px;
	text-align: center;
	cursor: wait;

	&.colored {
		color: var(--accent);
	}

	&.inline {
		display: inline;
		padding: 0;

		> .ring:after {
			width: 32px;
			height: 32px;
		}

		> .ring {
			&:before,
			&:after {
				width: 32px;
				height: 32px;
			}
		}
	}

	> .ring {
		position: relative;
		display: inline-block;
		vertical-align: middle;

		&:before,
		&:after {
			content: " ";
			display: block;
			box-sizing: border-box;
			width: 48px;
			height: 48px;
			border-radius: 50%;
			border: solid 4px;
		}

		&:before {
			border-color: currentColor;
			opacity: 0.3;
		}

		&:after {
			position: absolute;
			top: 0;
			border-color: currentColor transparent transparent transparent;
			animation: ring 0.5s linear infinite;
		}
	}
}
</style>
