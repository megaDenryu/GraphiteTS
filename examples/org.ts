// issue #23 本文の Person / Team / BelongsTo / Boss / Friends の例をそのまま実装したもの。
// ID 型とその生成関数は org-ids.ts、schema の ID 方針宣言は org-base.ts に
// 分けてある (この3ファイルで「Node と ID の関係」の3つの決定が揃う。
// README.md「設計上の発見」参照)。
import { ExactlyOneEdge, ZeroOrOneEdge, ManyEdge } from "../src/edge.js";
import { OrgNodeBase } from "./org-base.js";
import type { PersonId, TeamId, BelongsToId, BossId, FriendsId } from "./org-ids.js";

export type { PersonId, TeamId, BelongsToId, BossId, FriendsId } from "./org-ids.js";
export { makePersonId, makeTeamId, makeBelongsToId, makeBossId, makeFriendsId } from "./org-ids.js";

// Person/Team はライブラリ (Node) が要求する string | number ではなく、
// schema の方針宣言 (OrgNodeBase) が要求する branded Id を経由して束縛される。
export class Person extends OrgNodeBase<PersonId> {
  constructor(
    id: PersonId,
    readonly name: string,
  ) {
    super(id);
  }
}

export class Team extends OrgNodeBase<TeamId> {
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
