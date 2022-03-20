import { Cache } from "@/misc/cache";
import { Note } from "@/models/entities/note";
import { User } from "@/models/entities/user";

export const userCache = new Cache<User | null>(1000 * 60 * 30);
export const noteCache = new Cache<Note | null>(1000 * 60 * 30);
