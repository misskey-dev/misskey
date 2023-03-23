/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkRange from './MkRange.vue';
const meta = {
	title: 'components/MkRange',
	component: MkRange,
} satisfies Meta<typeof MkRange>;
export const Default = {
	render(args) {
		return {
			components: {
				MkRange,
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
			template: '<MkRange v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkRange>;
export default meta;
