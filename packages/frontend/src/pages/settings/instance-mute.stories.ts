/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import instance_mute from './instance-mute.vue';
const meta = {
	title: 'pages/settings/instance-mute',
	component: instance_mute,
} satisfies Meta<typeof instance_mute>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				instance_mute,
			},
			props: Object.keys(argTypes),
			template: '<instance_mute v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof instance_mute>;
export default meta;
