<script lang="ts">
import { defineComponent, h, resolveDirective, withDirectives } from 'vue';

export default defineComponent({
	props: {
		modelValue: {
			required: true,
		},
	},
	render() {
		const options = this.$slots.default();

		return withDirectives(h('div', {
			class: 'pxhvhrfw',
		}, options.map(option => withDirectives(h('button', {
			class: ['_button', { active: this.modelValue === option.props.value }],
			key: option.key,
			disabled: this.modelValue === option.props.value,
			onClick: () => {
				this.$emit('update:modelValue', option.props.value);
			}
		}, option.children), [
			[resolveDirective('click-anime')]
		]))), [
			[resolveDirective('size'), { max: [500] }]
		]);
	}
});
</script>

<style lang="scss">
.pxhvhrfw {
	display: flex;
	font-size: 90%;

	> button {
		flex: 1;
		padding: 10px 8px;
		border-radius: var(--radius);

		&:disabled {
			opacity: 1 !important;
			cursor: default;
		}

		&.active {
			color: var(--accent);
			background: var(--accentedBg);
		}

		&:not(.active):hover {
			color: var(--fgHighlighted);
			background: var(--panelHighlight);
		}

		&:not(:first-child) {
			margin-left: 8px;
		}

		> .icon {
			margin-right: 6px;
		}
	}

	&.max-width_500px {
		font-size: 80%;

		> button {
			padding: 11px 8px;
		}
	}
}
</style>
