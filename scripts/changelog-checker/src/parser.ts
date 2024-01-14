import * as fs from 'node:fs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { Heading, List, Node } from 'mdast';
import { toString } from 'mdast-util-to-string';

export class Release {
	public readonly releaseName: string;
	public readonly categories: ReleaseCategory[];

	constructor(releaseName: string, categories: ReleaseCategory[] = []) {
		this.releaseName = releaseName;
		this.categories = [...categories];
	}
}

export class ReleaseCategory {
	public readonly categoryName: string;
	public readonly items: string[];

	constructor(categoryName: string, items: string[] = []) {
		this.categoryName = categoryName;
		this.items = [...items];
	}
}

function isHeading(node: Node): node is Heading {
	return node.type === 'heading';
}

function isList(node: Node): node is List {
	return node.type === 'list';
}

export function parseChangeLog(path: string): Release[] {
	const input = fs.readFileSync(path, { encoding: 'utf8' });
	const processor = unified().use(remarkParse);

	const releases: Release[] = [];
	const root = processor.parse(input);

	let release: Release | null = null;
	let category: ReleaseCategory | null = null;
	for (const it of root.children) {
		if (isHeading(it) && it.depth === 2) {
			// リリース
			release = new Release(toString(it));
			releases.push(release);
		} else if (isHeading(it) && it.depth === 3 && release) {
			// リリース配下のカテゴリ
			category = new ReleaseCategory(toString(it));
			release.categories.push(category);
		} else if (isList(it) && category) {
			for (const listItem of it.children) {
				// カテゴリ配下のリスト項目
				category.items.push(toString(listItem));
			}
		}
	}

	return releases;
}
