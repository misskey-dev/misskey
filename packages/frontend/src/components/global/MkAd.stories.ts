import { Meta, StoryObj } from '@storybook/vue3';
import MkAd from './MkAd.vue';
const meta = {
	title: 'components/global/MkAd',
	component: MkAd,
} satisfies Meta<typeof MkAd>;
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
} satisfies StoryObj<typeof MkAd>;
export default meta;
