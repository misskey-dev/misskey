import { Meta, Story } from '@storybook/vue3';
import sounds_sound from './sounds.sound.vue';
const meta = {
	title: 'pages/settings/sounds.sound',
	component: sounds_sound,
};
export const Default = {
	components: {
		sounds_sound,
	},
	template: '<sounds_sound />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
