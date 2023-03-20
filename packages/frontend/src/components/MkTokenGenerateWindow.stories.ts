import { Meta, Story } from '@storybook/vue3';
import MkTokenGenerateWindow from './MkTokenGenerateWindow.vue';
const meta = {
	title: 'components/MkTokenGenerateWindow',
	component: MkTokenGenerateWindow,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkTokenGenerateWindow,
			},
			props: Object.keys(argTypes),
			template: '<MkTokenGenerateWindow v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
