import { Meta, Story } from '@storybook/vue3';
import sounds_sound from './sounds.sound.vue';
const meta = {
	title: 'pages/settings/sounds.sound',
	component: sounds_sound,
};
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
};
export default meta;
