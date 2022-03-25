import { Cache } from "@/misc/cache.js";
import { User } from "@/models/entities/user.js";

export const userCache = new Cache<User | null>(1000 * 60 * 30);
