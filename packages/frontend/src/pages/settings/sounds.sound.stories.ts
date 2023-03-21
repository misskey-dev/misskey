/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import sounds_sound from './sounds.sound.vue';
const meta = {
	title: 'pages/settings/sounds.sound',
	component: sounds_sound,
} satisfies Meta<typeof sounds_sound>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				sounds_sound,
			},
			props: Object.keys(argTypes),
			template: '<sounds_sound v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof sounds_sound>;
export default meta;
