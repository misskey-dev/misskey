<template>
<transition name="zoom-in-top" appear @after-leave="$emit('closed')">
	<div class="buebdbiu _acrylic _shadow" v-if="showing">
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

			let x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
			let y = rect.top + window.pageYOffset + this.source.offsetHeight;

			x -= (this.$el.offsetWidth / 2);

			this.$el.style.left = x + 'px';
			this.$el.style.top = y + 'px';
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
	border-radius: 4px;
	pointer-events: none;
	transform-origin: center -16px;
}
</style>
