import { Meta, Story } from '@storybook/vue3';
import MkUserList from './MkUserList.vue';
const meta = {
	title: 'components/MkUserList',
	component: MkUserList,
};
export const Default = {
	components: {
		MkUserList,
	},
	template: '<MkUserList />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
