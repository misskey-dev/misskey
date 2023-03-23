/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import cpu_ from './cpu.vue';
const meta = {
	title: 'widgets/server-metric/cpu',
	component: cpu_,
} satisfies Meta<typeof cpu_>;
export const Default = {
	render(args) {
		return {
			components: {
				cpu_,
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
			template: '<cpu_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof cpu_>;
export default meta;
