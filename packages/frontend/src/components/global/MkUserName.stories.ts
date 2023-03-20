import { Meta, Story } from '@storybook/vue3';
import MkUserName from './MkUserName.vue';
const meta = {
	title: 'components/global/MkUserName',
	component: MkUserName,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkUserName,
			},
			props: Object.keys(argTypes),
			template: '<MkUserName v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
