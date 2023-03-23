/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkDrive_folder from './MkDrive.folder.vue';
const meta = {
	title: 'components/MkDrive.folder',
	component: MkDrive_folder,
} satisfies Meta<typeof MkDrive_folder>;
export const Default = {
	render(args) {
		return {
			components: {
				MkDrive_folder,
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
			template: '<MkDrive_folder v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkDrive_folder>;
export default meta;
