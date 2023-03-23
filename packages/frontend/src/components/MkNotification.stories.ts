/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkNotification from './MkNotification.vue';
const meta = {
	title: 'components/MkNotification',
	component: MkNotification,
} satisfies Meta<typeof MkNotification>;
export const Default = {
	render(args) {
		return {
			components: {
				MkNotification,
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
			template: '<MkNotification v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkNotification>;
export default meta;
