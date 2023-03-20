import { Meta, Story } from '@storybook/vue3';
import privacy from './privacy.vue';
const meta = {
	title: 'pages/settings/privacy',
	component: privacy,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				privacy,
			},
			props: Object.keys(argTypes),
			template: '<privacy v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
