// TO BE REMOVED: https://github.com/archiverjs/node-archiver/pull/842

declare module "archiver" {
	/*
	*
	* Based on
	* https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/archiver/index.d.ts
	*
	* Permission is hereby granted, free of charge, to any person obtaining a copy of this
	* software and associated documentation files (the "Software"), to deal in the
	* Software without restriction, including without limitation the rights to use, copy,
	* modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
	* and to permit persons to whom the Software is furnished to do so, subject to the
	* following conditions:
	*
	* The above copyright notice and this permission notice shall be included in all
	* copies or substantial portions of the Software.
	*
	* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
	* INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
	* PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
	* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
	* CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
	* OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
	*
	*/
	import * as fs from 'fs';
	import * as stream from 'stream';
	import * as ReaddirGlob from 'readdir-glob';
	import { ZlibOptions } from 'zlib';

	type Partial<T> = {
		[P in keyof T]?: T[P];
	};

	// This library adds `cwd` to the options
	export type GlobOptions = ReaddirGlob.Options & { cwd?: string };

	export interface EntryData {
		/** Sets the entry name including internal path */
		name: string;
		/** Sets the entry date */
		date?: Date | string | undefined;
		/** Sets the entry permissions */
		mode?: number | undefined;
		/**
		 * Sets a path prefix for the entry name.
		 * Useful when working with methods like `directory` or `glob`
		 */
		prefix?: string | undefined;
		/**
		 * Sets the fs stat data for this entry allowing
		 * for reduction of fs stat calls when stat data is already known
		 */
		stats?: fs.Stats | undefined;
	}

	export interface ZipEntryData extends EntryData {
		/** Sets the compression method to STORE */
		store?: boolean | undefined;
	}

	export type TarEntryData = EntryData;

	export interface ProgressData {
		entries: {
			total: number;
			processed: number;
		};
		fs: {
			totalBytes: number;
			processedBytes: number;
		};
	}

	/** A function that lets you either opt out of including an entry (by returning false), or modify the contents of an entry as it is added (by returning an EntryData) */
	export type EntryDataFunction = (entry: EntryData) => false | EntryData;

	export class ArchiverError extends Error {
		code: string; // Since archiver format support is modular, we cannot enumerate all possible error codes, as the modules can throw arbitrary ones.
		data: any;
		path?: any;

		constructor(code: string, data: any);
	}

	export class Archiver extends stream.Transform {
		constructor(options?: ArchiverOptions);

		abort(): this;
		append(
			source: stream.Readable | Buffer | string,
			data?: EntryData | ZipEntryData | TarEntryData,
		): this;

		/**
		 * If false is passed for destpath, the path of a chunk of data in the archive is set
		 * to the root. If no destpath is provided the dirpath is used.
		 */
		directory(
			dirpath: string,
			destpath?: false | string,
			data?: Partial<EntryData> | EntryDataFunction,
		): this;
		file(filename: string, data: EntryData): this;
		glob(pattern: string, options?: GlobOptions, data?: Partial<EntryData>): this;
		finalize(): Promise<void>;

		setFormat(format: string): this;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
		setModule(module: Function): this;

		pointer(): number;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
		use(plugin: Function): this;

		symlink(filepath: string, target: string, mode?: number): this;

		on(
			event: "error" | "warning",
			listener: (error: ArchiverError) => void,
		): this;
		on(event: "data", listener: (data: Buffer) => void): this;
		on(event: "progress", listener: (progress: ProgressData) => void): this;
		on(event: "close" | "drain" | "finish", listener: () => void): this;
		on(event: "pipe" | "unpipe", listener: (src: stream.Readable) => void): this;
		on(event: "entry", listener: (entry: EntryData) => void): this;
		on(event: string, listener: (...args: any[]) => void): this;
	}

	export type ArchiverOptions = CoreOptions &
		TransformOptions &
		ZipOptions &
		TarOptions;

	export interface CoreOptions {
		statConcurrency?: number | undefined;
	}

	export interface TransformOptions {
		allowHalfOpen?: boolean | undefined;
		readableObjectMode?: boolean | undefined;
		writeableObjectMode?: boolean | undefined;
		decodeStrings?: boolean | undefined;
		encoding?: string | undefined;
		highWaterMark?: number | undefined;
		objectmode?: boolean | undefined;
	}

	export interface ZipOptions {
		comment?: string | undefined;
		forceLocalTime?: boolean | undefined;
		forceZip64?: boolean | undefined;
		/** @default false */
		namePrependSlash?: boolean | undefined;
		store?: boolean | undefined;
		zlib?: ZlibOptions | undefined;
	}

	export interface TarOptions {
		gzip?: boolean | undefined;
		gzipOptions?: ZlibOptions | undefined;
	}

	export class ZipArchive extends Archiver {
		constructor(options?: ArchiverOptions & ZipOptions);
	}

	export class TarArchive extends Archiver {
		constructor(options?: ArchiverOptions & TarOptions);
	}

	export class JsonArchive extends Archiver {
		constructor(options?: ArchiverOptions);
	}
}
