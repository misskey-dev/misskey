import { Meta, Story } from '@storybook/vue3';
import clip from './clip.vue';
const meta = {
	title: 'pages/clip',
	component: clip,
};
export const Default = {
	components: {
		clip,
	},
	template: '<clip />',
};
export default meta;
