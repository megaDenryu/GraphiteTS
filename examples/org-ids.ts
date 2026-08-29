// org.ts で使う ID 型と、その生成関数をまとめたファイル。
import { idOf } from "../src/id.js";
import type { Id } from "../src/id.js";

export type PersonId = Id<"PersonId">;
export type TeamId = Id<"TeamId">;
export type BelongsToId = Id<"BelongsToId">;
export type BossId = Id<"BossId">;
export type FriendsId = Id<"FriendsId">;

export function makePersonId(value: string): PersonId {
  return idOf<"PersonId">(value);
}
export function makeTeamId(value: string): TeamId {
  return idOf<"TeamId">(value);
}
export function makeBelongsToId(value: string): BelongsToId {
  return idOf<"BelongsToId">(value);
}
export function makeBossId(value: string): BossId {
  return idOf<"BossId">(value);
}
export function makeFriendsId(value: string): FriendsId {
  return idOf<"FriendsId">(value);
}
