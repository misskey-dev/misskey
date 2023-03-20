import { Meta, Story } from '@storybook/vue3';
import reaction from './reaction.vue';
const meta = {
	title: 'pages/settings/reaction',
	component: reaction,
};
export const Default = {
	components: {
		reaction,
	},
	template: '<reaction />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
