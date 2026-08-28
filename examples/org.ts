// issue #23 本文の Person / Team / BelongsTo / Boss / Friends の例をそのまま実装したもの。
import { Node } from "../src/node.js";
import { ExactlyOneEdge, ZeroOrOneEdge, ManyEdge } from "../src/edge.js";
import { idOf } from "../src/id.js";
import type { Id } from "../src/id.js";

export type PersonId = Id<"PersonId">;
export type TeamId = Id<"TeamId">;
export type BelongsToId = Id<"BelongsToId">;
export type BossId = Id<"BossId">;
export type FriendsId = Id<"FriendsId">;

export class Person extends Node<PersonId> {
  constructor(
    id: PersonId,
    readonly name: string,
  ) {
    super(id);
  }
}

export class Team extends Node<TeamId> {
  constructor(
    id: TeamId,
    readonly name: string,
  ) {
    super(id);
  }
}

// 各 Person は所属する Team をちょうど1つ持つ (multiplicity: exactlyOne)。
// domainNodeClass = Person を宣言することで、GraphBuilder.freeze() が
// 「全 Person が BelongsTo をちょうど1件持つか」まで検証できる。
export class BelongsTo extends ExactlyOneEdge<BelongsToId, Person, Team> {
  static readonly domainNodeClass = Person;

  get member(): Person {
    return this.from;
  }

  get team(): Team {
    return this.to;
  }
}

export interface BossPayload {
  readonly since: string;
}

// 上司は0人か1人 (multiplicity: zeroOrOne)。
export class Boss extends ZeroOrOneEdge<BossId, Person, Person, BossPayload> {
  get subordinate(): Person {
    return this.from;
  }

  get superior(): Person {
    return this.to;
  }
}

// 友人関係は何人でも (multiplicity: many)。
export class Friends extends ManyEdge<FriendsId, Person, Person> {
  get a(): Person {
    return this.from;
  }

  get b(): Person {
    return this.to;
  }
}

export type OrgNode = Person | Team;
export type OrgEdge = BelongsTo | Boss | Friends;

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
