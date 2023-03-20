import { Meta, Story } from '@storybook/vue3';
import share from './share.vue';
const meta = {
	title: 'pages/share',
	component: share,
};
export const Default = {
	components: {
		share,
	},
	template: '<share />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
