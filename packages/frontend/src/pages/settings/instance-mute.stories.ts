/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import instance_mute from './instance-mute.vue';
const meta = {
	title: 'pages/settings/instance-mute',
	component: instance_mute,
} satisfies Meta<typeof instance_mute>;
export const Default = {
	render(args) {
		return {
			components: {
				instance_mute,
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
			template: '<instance_mute v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof instance_mute>;
export default meta;
