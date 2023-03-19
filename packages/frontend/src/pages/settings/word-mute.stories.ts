import { Meta, Story } from '@storybook/vue3';
import word_mute from './word-mute.vue';
const meta = {
	title: 'pages/settings/word-mute',
	component: word_mute,
};
export const Default = {
	components: {
		word_mute,
	},
	template: '<word-mute />',
};
export default meta;
