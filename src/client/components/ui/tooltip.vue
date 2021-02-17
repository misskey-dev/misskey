<template>
<transition name="tooltip" appear @after-leave="$emit('closed')">
	<div class="buebdbiu _acrylic _shadow" v-show="showing" ref="content">
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

			const contentWidth = this.$refs.content.offsetWidth;
			const contentHeight = this.$refs.content.offsetHeight;

			let left = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
			let top = rect.top + window.pageYOffset + this.source.offsetHeight;

			left -= (this.$el.offsetWidth / 2);

			if (left + contentWidth - window.pageXOffset > window.innerWidth) {
				left = window.innerWidth - contentWidth + window.pageXOffset - 1;
			}

			if (top + contentHeight - window.pageYOffset > window.innerHeight) {
				top = rect.top + window.pageYOffset - contentHeight;
				this.$refs.content.style.transformOrigin = 'center bottom';
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
	max-width: 240px;
	font-size: 0.8em;
	padding: 8px 12px;
	text-align: center;
	border-radius: 4px;
	pointer-events: none;
	transform-origin: center top;
}
</style>
