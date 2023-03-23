/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkModalPageWindow from './MkModalPageWindow.vue';
const meta = {
	title: 'components/MkModalPageWindow',
	component: MkModalPageWindow,
} satisfies Meta<typeof MkModalPageWindow>;
export const Default = {
	render(args) {
		return {
			components: {
				MkModalPageWindow,
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
			template: '<MkModalPageWindow v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkModalPageWindow>;
export default meta;
