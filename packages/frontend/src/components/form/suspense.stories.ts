import { Meta, Story } from '@storybook/vue3';
import suspense from './suspense.vue';
const meta = {
	title: 'components/form/suspense',
	component: suspense,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				suspense,
			},
			props: Object.keys(argTypes),
			template: '<suspense v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
