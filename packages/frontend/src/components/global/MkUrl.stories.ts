import { Meta, StoryObj } from '@storybook/vue3';
import MkUrl from './MkUrl.vue';
const meta = {
	title: 'components/global/MkUrl',
	component: MkUrl,
} satisfies Meta<typeof MkUrl>;
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
} satisfies StoryObj<typeof MkUrl>;
export default meta;
