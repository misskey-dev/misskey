import { Meta, Story } from '@storybook/vue3';
import MkPageHeader from './MkPageHeader.vue';
const meta = {
	title: 'components/global/MkPageHeader',
	component: MkPageHeader,
};
export const Default = {
	components: {
		MkPageHeader,
	},
	template: '<MkPageHeader />',
};
export default meta;
