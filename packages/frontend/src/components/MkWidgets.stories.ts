/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkWidgets from './MkWidgets.vue';
const meta = {
	title: 'components/MkWidgets',
	component: MkWidgets,
} satisfies Meta<typeof MkWidgets>;
export const Default = {
	render(args) {
		return {
			components: {
				MkWidgets,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<MkWidgets v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkWidgets>;
export default meta;
