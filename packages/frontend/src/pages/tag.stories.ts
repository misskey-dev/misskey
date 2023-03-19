import { Meta, Story } from '@storybook/vue3';
import tag from './tag.vue';
const meta = {
	title: 'pages/tag',
	component: tag,
};
export const Default = {
	components: {
		tag,
	},
	template: '<tag />',
};
export default meta;
