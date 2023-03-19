import { Meta, Story } from '@storybook/vue3';
import MkNotification from './MkNotification.vue';
const meta = {
	title: 'components/MkNotification',
	component: MkNotification,
};
export const Default = {
	components: {
		MkNotification,
	},
	template: '<MkNotification />',
};
export default meta;
