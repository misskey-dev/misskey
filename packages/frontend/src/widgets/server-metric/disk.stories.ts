/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import disk_ from './disk.vue';
const meta = {
	title: 'widgets/server-metric/disk',
	component: disk_,
} satisfies Meta<typeof disk_>;
export const Default = {
	render(args) {
		return {
			components: {
				disk_,
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
			template: '<disk_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof disk_>;
export default meta;
