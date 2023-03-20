import { Meta, Story } from '@storybook/vue3';
import MkUserList from './MkUserList.vue';
const meta = {
	title: 'components/MkUserList',
	component: MkUserList,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkUserList,
			},
			props: Object.keys(argTypes),
			template: '<MkUserList v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
