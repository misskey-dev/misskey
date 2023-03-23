/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkRippleEffect from './MkRippleEffect.vue';
const meta = {
	title: 'components/MkRippleEffect',
	component: MkRippleEffect,
} satisfies Meta<typeof MkRippleEffect>;
export const Default = {
	render(args) {
		return {
			components: {
				MkRippleEffect,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<MkRippleEffect v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkRippleEffect>;
export default meta;
