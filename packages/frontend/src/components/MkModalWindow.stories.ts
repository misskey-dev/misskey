/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkModalWindow from './MkModalWindow.vue';
const meta = {
	title: 'components/MkModalWindow',
	component: MkModalWindow,
} satisfies Meta<typeof MkModalWindow>;
export const Default = {
	render(args) {
		return {
			components: {
				MkModalWindow,
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
			template: '<MkModalWindow v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkModalWindow>;
export default meta;
