/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkWindow from './MkWindow.vue';
const meta = {
	title: 'components/MkWindow',
	component: MkWindow,
} satisfies Meta<typeof MkWindow>;
export const Default = {
	render(args) {
		return {
			components: {
				MkWindow,
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
			template: '<MkWindow v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkWindow>;
export default meta;
