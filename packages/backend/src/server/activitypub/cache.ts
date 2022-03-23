import { Cache } from "@/misc/cache.js";
import { Note } from "@/models/entities/note.js";
import { User } from "@/models/entities/user.js";

export const userCache = new Cache<User | null>(1000 * 60 * 30);
export const noteCache = new Cache<Note | null>(1000 * 60 * 30);
