import { Meta, Story } from '@storybook/vue3';
import overview_ap_requests from './overview.ap-requests.vue';
const meta = {
	title: 'pages/admin/overview.ap-requests',
	component: overview_ap_requests,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				overview_ap_requests,
			},
			props: Object.keys(argTypes),
			template: '<overview_ap_requests v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
