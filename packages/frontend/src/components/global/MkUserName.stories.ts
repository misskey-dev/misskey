import { Meta, Story } from '@storybook/vue3';
import MkUserName from './MkUserName.vue';
const meta = {
	title: 'components/global/MkUserName',
	component: MkUserName,
};
export const Default = {
	components: {
		MkUserName,
	},
	template: '<MkUserName />',
};
export default meta;
