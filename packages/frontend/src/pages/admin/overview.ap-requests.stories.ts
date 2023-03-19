import { Meta, Story } from '@storybook/vue3';
import overview_ap_requests from './overview.ap-requests.vue';
const meta = {
	title: 'pages/admin/overview.ap-requests',
	component: overview_ap_requests,
};
export const Default = {
	components: {
		overview_ap_requests,
	},
	template: '<overview.ap-requests />',
};
export default meta;
