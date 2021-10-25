<template>
<transition name="tooltip" appear @after-leave="$emit('closed')">
	<div class="buebdbiu _acrylic _shadow" v-show="showing" ref="content" :style="{ maxWidth: maxWidth + 'px' }">
		<slot>{{ text }}</slot>
	</div>
</transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

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
		},
		maxWidth: {
			type: Number,
			required: false,
			default: 250,
		},
	},

	emits: ['closed'],

	mounted() {
		this.$nextTick(() => {
			if (this.source == null) {
				this.$emit('closed');
				return;
			}

			const rect = this.source.getBoundingClientRect();

			const contentWidth = this.$refs.content.offsetWidth;
			const contentHeight = this.$refs.content.offsetHeight;

			let left = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
			let top = rect.top + window.pageYOffset - contentHeight;

			left -= (this.$el.offsetWidth / 2);

			if (left + contentWidth - window.pageXOffset > window.innerWidth) {
				left = window.innerWidth - contentWidth + window.pageXOffset - 1;
			}

			if (top - window.pageYOffset < 0) {
				top = rect.top + window.pageYOffset + this.source.offsetHeight;
				this.$refs.content.style.transformOrigin = 'center top';
			}

			this.$el.style.left = left + 'px';
			this.$el.style.top = top + 'px';
		});
	},
})
</script>

<style lang="scss" scoped>
.tooltip-enter-active,
.tooltip-leave-active {
	opacity: 1;
	transform: scale(1);
	transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1), opacity 200ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tooltip-enter-from,
.tooltip-leave-active {
	opacity: 0;
	transform: scale(0.75);
}

.buebdbiu {
	position: absolute;
	z-index: 11000;
	font-size: 0.8em;
	padding: 8px 12px;
	box-sizing: border-box;
	text-align: center;
	border-radius: 4px;
	border: solid 0.5px var(--divider);
	pointer-events: none;
	transform-origin: center bottom;
}
</style>
