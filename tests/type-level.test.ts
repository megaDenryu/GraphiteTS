// このファイルの主目的は `npm run typecheck` (tsc --noEmit) による検証である。
// `@ts-expect-error` の行は「その行が実際にコンパイルエラーになること」を
// tsc 自身が検査する (エラーが起きなければ @ts-expect-error 自体が
// 「unused directive」としてエラーになる)。vitest 側は実行時に落ちないことだけを見る。
import { describe, it, expect } from "vitest";
import { GraphBuilder, createGraph } from "../src/builder.js";
import { Node } from "../src/node.js";
import { Edge } from "../src/edge.js";
import { idOf } from "../src/id.js";
import type { Id } from "../src/id.js";
import type { EdgeFrom, EdgeTo, EdgePayload, TraversalResult } from "../src/traversal.js";
import { Person, Team, BelongsTo, Boss, Friends } from "../examples/org.js";
import type { OrgNode, OrgEdge, BossPayload } from "../examples/org.js";
import { OrgNodeBase } from "../examples/org-base.js";

// schema (OrgNode | OrgEdge) に含まれない Node/Edge
type ProjectId = Id<"ProjectId">;
class Project extends Node<ProjectId> {
  constructor(
    id: ProjectId,
    readonly title: string,
  ) {
    super(id);
  }
}

type FriendshipId = Id<"FriendshipId">;
class Friendship extends Edge<FriendshipId, Person, Person> {}

// 型レベルの等値検査ヘルパー。false になると Expect<false> が
// `true` を満たさず、この行自体がコンパイルエラーになる。
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
  ? true
  : false;
type Expect<T extends true> = T;

type _EdgeFromIsPerson = Expect<Equal<EdgeFrom<BelongsTo>, Person>>;
type _EdgeToIsTeam = Expect<Equal<EdgeTo<BelongsTo>, Team>>;
type _EdgePayloadIsBossPayload = Expect<Equal<EdgePayload<Boss>, BossPayload>>;
type _EdgePayloadIsUndefined = Expect<Equal<EdgePayload<BelongsTo>, undefined>>;

type _TraversalExactlyOne = Expect<Equal<TraversalResult<BelongsTo>, BelongsTo>>;
type _TraversalZeroOrOne = Expect<Equal<TraversalResult<Boss>, Boss | undefined>>;
type _TraversalMany = Expect<Equal<TraversalResult<Friends>, readonly Friends[]>>;

describe("schema 外の Node/Edge を compile error にできるか", () => {
  it("GraphBuilder.addNode/addEdge は schema 外の型を拒否する", () => {
    const builder = new GraphBuilder<OrgNode, OrgEdge>();
    const project = new Project(idOf<"ProjectId">("proj-1"), "Graphite");
    // @ts-expect-error Project は OrgNode (Person | Team) に含まれない
    builder.addNode(project);

    const alice = new Person(idOf<"PersonId">("p-a"), "Alice");
    const carol = new Person(idOf<"PersonId">("p-c"), "Carol");
    const friendship = new Friendship(idOf<"FriendshipId">("fs-1"), alice, carol, undefined);
    // @ts-expect-error Friendship は OrgEdge (BelongsTo | Boss | Friends) に含まれない
    builder.addEdge(friendship);

    expect(true).toBe(true);
  });
});

describe("createGraph の endpoint 検査 (EdgeNodes<E> extends N)", () => {
  it("endpoint が Node 集合に含まれていれば呼び出せる", () => {
    const builder = createGraph<OrgNode, OrgEdge>();
    expect(builder).toBeInstanceOf(GraphBuilder);
  });

  it("endpoint (Team) が Node 集合に含まれない場合は引数無しで呼べない", () => {
    // BelongsTo の endpoint は Person | Team だが、Node 集合が Person だけなので
    // rest parameter の tuple 型が長さ1になり、引数無しの呼び出しが compile error になる
    // @ts-expect-error Team が Node 集合に含まれないため endpoint 検査に落ちる
    createGraph<Person, BelongsTo>();
    expect(true).toBe(true);
  });
});

// Node と ID の関係は3つの決定に分かれる (README.md「設計上の発見」参照)。
// - 決定1 (各ノードの束縛): Person が `extends OrgNodeBase<PersonId>` を書く
//   (examples/org.ts)
// - 決定2 (ライブラリの能力契約): Node (../src/node.ts) は ID に
//   string | number だけを要求し、branded かどうかは問わない
// - 決定3 (schema の ID 方針宣言): OrgNodeBase (../examples/org-base.ts) が
//   「この schema では branded Id<Tag> を必須にする」と宣言する
// 以下はこの3つを型レベルで裏付けるテストである。
describe("Node と ID の関係 (決定2: ライブラリの能力契約 / 決定3: schema の ID 方針宣言)", () => {
  it("生 string ID は Node 直接継承では合法 (branded 必須はライブラリの決定でない)", () => {
    class RawIdNode extends Node<string> {}
    const raw = new RawIdNode("raw-1");
    expect(raw.id).toBe("raw-1");
  });
});

// 決定2: オブジェクトを ID にすると Node<NodeId extends string | number> の
// 制約に落ちる。String(id) でキー化する Graph (../src/graph.ts) がオブジェクト ID を
// "[object Object]" へ潰して衝突する事故を、ここで型として防いでいる。
type ObjectId = { readonly x: number };
// @ts-expect-error オブジェクトは Node<NodeId extends string | number> の制約を満たさない
class ObjectIdNode extends Node<ObjectId> {}

// 決定3: 生 string は Node<string> としては合法 (上のテスト参照) だが、
// OrgNodeBase<string> としては schema の方針宣言 (branded Id<Tag> 必須) に
// 違反する。ライブラリの制約としては通る型が、schema の制約としては
// 落ちるという対比がここに現れている。
// @ts-expect-error OrgNodeBase<NodeId extends Id<string>> は branded でない生 string を拒否する
class RawIdOrgNode extends OrgNodeBase<string> {}
