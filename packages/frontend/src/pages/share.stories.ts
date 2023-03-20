import { Meta, Story } from '@storybook/vue3';
import share from './share.vue';
const meta = {
	title: 'pages/share',
	component: share,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				share,
			},
			props: Object.keys(argTypes),
			template: '<share v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
