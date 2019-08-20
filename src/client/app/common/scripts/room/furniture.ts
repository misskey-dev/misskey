export type RoomInfo = {
	roomType: string;
	carpetColor: string;
	furnitures: Furniture[];
};

export type Furniture = {
	id: string; // 同じ家具が複数ある場合にそれぞれを識別するためのIDであり、家具IDではない
	type: string; // こっちが家具ID(chairとか)
	position: {
		x: number;
		y: number;
		z: number;
	};
	rotation: {
		x: number;
		y: number;
		z: number;
	};
	props?: Record<string, any>;
};
