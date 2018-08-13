type Node<T> = { value: T, next: Node<T> };

export default class Queue<T> {
	private top: Node<T> = null;
	private rear: Node<T> = null;
	public length: number = 0;

	public push(value: T): void {
		const node: Node<T> = { value, next: null };
		if (this.top === null) {
			this.top = node;
			this.rear = node;
		} else {
			this.rear.next = node;
			this.rear = node;
		}
		this.length++;
	}

	public pop(): void {
		this.top = this.top.next;
		if (this.top == null) this.rear = null;
		this.length--;
	}

	public toArray(): T[] {
		const arr: T[] = Array<T>(this.length);
		for (let node = this.top, i = 0; node !== null; node = node.next, i++) {
			arr[i] = node.value;
		}
		return arr;
	}
}
