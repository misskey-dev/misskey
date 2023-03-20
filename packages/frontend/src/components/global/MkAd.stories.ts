import { Meta, Story } from '@storybook/vue3';
import MkAd from './MkAd.vue';
const meta = {
	title: 'components/global/MkAd',
	component: MkAd,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkAd,
			},
			props: Object.keys(argTypes),
			template: '<MkAd v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
