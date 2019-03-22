import * as fs from 'fs';
import { DriveFile } from '../../models/drive-file';

const store = `${__dirname}/../../../../files`;

export function del(file: DriveFile) {
	fs.unlink(`${store}/${file.id}`, () => {});
	fs.unlink(`${store}/${file.id}-thumbnail`, () => {});
	fs.unlink(`${store}/${file.id}-webpublic`, () => {});
}
