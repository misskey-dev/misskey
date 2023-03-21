/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import sounds_ from './sounds.vue';
const meta = {
	title: 'pages/settings/sounds',
	component: sounds_,
} satisfies Meta<typeof sounds_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				sounds_,
			},
			props: Object.keys(argTypes),
			template: '<sounds_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof sounds_>;
export default meta;
