import { Meta, Story } from '@storybook/vue3';
import overview_federation from './overview.federation.vue';
const meta = {
	title: 'pages/admin/overview.federation',
	component: overview_federation,
};
export const Default = {
	components: {
		overview_federation,
	},
	template: '<overview_federation />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
