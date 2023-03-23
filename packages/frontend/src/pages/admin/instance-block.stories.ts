/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import instance_block from './instance-block.vue';
const meta = {
	title: 'pages/admin/instance-block',
	component: instance_block,
} satisfies Meta<typeof instance_block>;
export const Default = {
	render(args) {
		return {
			components: {
				instance_block,
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
			template: '<instance_block v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof instance_block>;
export default meta;
