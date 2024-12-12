import { Badge } from "./schemas";
export type { Badge };

export type BadgeFactory = (userId: string) => Badge[];
