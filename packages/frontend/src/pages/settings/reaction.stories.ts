import { Meta, Story } from '@storybook/vue3';
import reaction from './reaction.vue';
const meta = {
	title: 'pages/settings/reaction',
	component: reaction,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				reaction,
			},
			props: Object.keys(argTypes),
			template: '<reaction v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
