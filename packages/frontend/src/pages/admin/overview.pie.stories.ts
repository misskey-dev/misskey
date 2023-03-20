import { Meta, Story } from '@storybook/vue3';
import overview_pie from './overview.pie.vue';
const meta = {
	title: 'pages/admin/overview.pie',
	component: overview_pie,
};
export const Default = {
	components: {
		overview_pie,
	},
	template: '<overview_pie />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
