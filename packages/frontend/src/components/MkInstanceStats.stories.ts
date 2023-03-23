/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkInstanceStats from './MkInstanceStats.vue';
const meta = {
	title: 'components/MkInstanceStats',
	component: MkInstanceStats,
} satisfies Meta<typeof MkInstanceStats>;
export const Default = {
	render(args) {
		return {
			components: {
				MkInstanceStats,
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
			template: '<MkInstanceStats v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkInstanceStats>;
export default meta;
