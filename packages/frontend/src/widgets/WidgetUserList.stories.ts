import { Meta, Story } from '@storybook/vue3';
import WidgetUserList from './WidgetUserList.vue';
const meta = {
	title: 'widgets/WidgetUserList',
	component: WidgetUserList,
};
export const Default = {
	components: {
		WidgetUserList,
	},
	template: '<WidgetUserList />',
};
export default meta;
