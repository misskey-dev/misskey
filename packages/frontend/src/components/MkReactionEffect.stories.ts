/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkReactionEffect from './MkReactionEffect.vue';
const meta = {
	title: 'components/MkReactionEffect',
	component: MkReactionEffect,
} satisfies Meta<typeof MkReactionEffect>;
export const Default = {
	render(args) {
		return {
			components: {
				MkReactionEffect,
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
			template: '<MkReactionEffect v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkReactionEffect>;
export default meta;
