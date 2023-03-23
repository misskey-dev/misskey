/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkReactionsViewer from './MkReactionsViewer.vue';
const meta = {
	title: 'components/MkReactionsViewer',
	component: MkReactionsViewer,
} satisfies Meta<typeof MkReactionsViewer>;
export const Default = {
	render(args) {
		return {
			components: {
				MkReactionsViewer,
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
			template: '<MkReactionsViewer v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkReactionsViewer>;
export default meta;
