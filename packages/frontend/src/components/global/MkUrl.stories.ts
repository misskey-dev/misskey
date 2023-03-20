import { Meta, Story } from '@storybook/vue3';
import MkUrl from './MkUrl.vue';
const meta = {
	title: 'components/global/MkUrl',
	component: MkUrl,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkUrl,
			},
			props: Object.keys(argTypes),
			template: '<MkUrl v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
