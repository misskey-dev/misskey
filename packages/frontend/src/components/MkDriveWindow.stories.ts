/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkDriveWindow from './MkDriveWindow.vue';
const meta = {
	title: 'components/MkDriveWindow',
	component: MkDriveWindow,
} satisfies Meta<typeof MkDriveWindow>;
export const Default = {
	render(args) {
		return {
			components: {
				MkDriveWindow,
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
			template: '<MkDriveWindow v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkDriveWindow>;
export default meta;
