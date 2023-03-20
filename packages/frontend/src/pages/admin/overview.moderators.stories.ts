import { Meta, Story } from '@storybook/vue3';
import overview_moderators from './overview.moderators.vue';
const meta = {
	title: 'pages/admin/overview.moderators',
	component: overview_moderators,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				overview_moderators,
			},
			props: Object.keys(argTypes),
			template: '<overview_moderators v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
