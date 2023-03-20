import { Meta, Story } from '@storybook/vue3';
import MkAd from './MkAd.vue';
const meta = {
	title: 'components/global/MkAd',
	component: MkAd,
};
export const Default = {
	components: {
		MkAd,
	},
	template: '<MkAd />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
