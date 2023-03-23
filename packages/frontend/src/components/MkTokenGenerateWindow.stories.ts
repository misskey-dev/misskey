/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkTokenGenerateWindow from './MkTokenGenerateWindow.vue';
const meta = {
	title: 'components/MkTokenGenerateWindow',
	component: MkTokenGenerateWindow,
} satisfies Meta<typeof MkTokenGenerateWindow>;
export const Default = {
	render(args) {
		return {
			components: {
				MkTokenGenerateWindow,
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
			template: '<MkTokenGenerateWindow v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkTokenGenerateWindow>;
export default meta;
