<template>
<transition name="zoom-in-top" appear @after-leave="$emit('closed')">
	<div class="buebdbiu" v-if="showing">
		<slot>{{ text }}</slot>
	</div>
</transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@/os';

export default defineComponent({
	props: {
		showing: {
			type: Boolean,
			required: true,
		},
		source: {
			required: true,
		},
		text: {
			type: String,
			required: false
		}
	},

	emits: ['closed'],

	mounted() {
		this.$nextTick(() => {
			if (this.source == null) {
				this.$emit('closed');
				return;
			}

			const rect = this.source.getBoundingClientRect();

			const x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
			const y = rect.top + window.pageYOffset + this.source.offsetHeight;
			this.$el.style.left = (x - 28) + 'px';
			this.$el.style.top = (y + 16) + 'px';
		});
	},
})
</script>

<style lang="scss" scoped>
.buebdbiu {
	position: absolute;
	z-index: 11000;
	max-width: 240px;
	font-size: 0.8em;
	padding: 8px 12px;
	text-align: center;
	background: var(--acrylicPanel);
	-webkit-backdrop-filter: blur(8px);
	backdrop-filter: blur(8px);
	border-radius: 4px;
	box-shadow: 0 2px 8px rgba(0,0,0,0.25);
	pointer-events: none;
	transform-origin: center -16px;
}
</style>
