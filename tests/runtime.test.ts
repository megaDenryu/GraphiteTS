import { describe, it, expect } from "vitest";
import { createGraph } from "../src/builder.js";
import {
  Person,
  Team,
  BelongsTo,
  Boss,
  Friends,
  makePersonId,
  makeTeamId,
  makeBelongsToId,
  makeBossId,
  makeFriendsId,
} from "../examples/org.js";
import type { OrgNode, OrgEdge } from "../examples/org.js";

function buildValidOrg() {
  const builder = createGraph<OrgNode, OrgEdge>();
  const alice = new Person(makePersonId("p-alice"), "Alice");
  const bob = new Person(makePersonId("p-bob"), "Bob");
  const carol = new Person(makePersonId("p-carol"), "Carol");
  const eng = new Team(makeTeamId("t-eng"), "Engineering");

  builder
    .addNode(alice)
    .addNode(bob)
    .addNode(carol)
    .addNode(eng)
    .addEdge(new BelongsTo(makeBelongsToId("bt-alice"), alice, eng, undefined))
    .addEdge(new BelongsTo(makeBelongsToId("bt-bob"), bob, eng, undefined))
    .addEdge(new BelongsTo(makeBelongsToId("bt-carol"), carol, eng, undefined))
    .addEdge(new Boss(makeBossId("boss-bob"), bob, alice, { since: "2020" }))
    .addEdge(new Friends(makeFriendsId("f-1"), alice, bob, undefined))
    .addEdge(new Friends(makeFriendsId("f-2"), alice, carol, undefined));

  return { builder, alice, bob, carol, eng };
}

describe("GraphBuilder / freeze の二段階構築", () => {
  it("多重度・endpoint がすべて満たされていれば freeze できる", () => {
    const { builder } = buildValidOrg();
    const graph = builder.freeze();
    expect(graph.nodes()).toHaveLength(4);
    expect(graph.edges()).toHaveLength(6);
  });

  it("endpoint が Graph に存在しない edge があれば freeze で例外になる", () => {
    const builder = createGraph<OrgNode, OrgEdge>();
    const alice = new Person(makePersonId("p-x"), "Alice");
    const eng = new Team(makeTeamId("t-x"), "Engineering");
    // eng を addNode していない状態で BelongsTo を追加する
    builder.addNode(alice).addEdge(new BelongsTo(makeBelongsToId("bt-x"), alice, eng, undefined));

    expect(() => builder.freeze()).toThrow(/存在しない/);
  });

  it("exactlyOne の edge を持たない Person がいれば freeze で例外になる (下限検査)", () => {
    const builder = createGraph<OrgNode, OrgEdge>();
    const alice = new Person(makePersonId("p-y1"), "Alice");
    const bob = new Person(makePersonId("p-y2"), "Bob");
    const eng = new Team(makeTeamId("t-y"), "Engineering");
    // alice だけ BelongsTo を追加し、bob には追加しない。
    // 下限検査は「追加された BelongsTo が1件以上ある」ことを前提に、
    // domainNodeClass (Person) に属する全ノードを見て回るため検出できる。
    // BelongsTo を1件も追加しない場合は edge class 自体が実行時に見えず、
    // 下限検査は発火しない (README に既知の限界として記載)。
    builder.addNode(alice).addNode(bob).addNode(eng).addEdge(new BelongsTo(makeBelongsToId("bt-y"), alice, eng, undefined));

    expect(() => builder.freeze()).toThrow(/exactlyOne/);
  });

  it("zeroOrOne の edge が2件あれば freeze で例外になる (上限検査)", () => {
    const builder = createGraph<OrgNode, OrgEdge>();
    const alice = new Person(makePersonId("p-z1"), "Alice");
    const bob = new Person(makePersonId("p-z2"), "Bob");
    const carol = new Person(makePersonId("p-z3"), "Carol");
    const eng = new Team(makeTeamId("t-z"), "Engineering");
    builder
      .addNode(alice)
      .addNode(bob)
      .addNode(carol)
      .addNode(eng)
      .addEdge(new BelongsTo(makeBelongsToId("bt-z1"), alice, eng, undefined))
      .addEdge(new BelongsTo(makeBelongsToId("bt-z2"), bob, eng, undefined))
      .addEdge(new BelongsTo(makeBelongsToId("bt-z3"), carol, eng, undefined))
      .addEdge(new Boss(makeBossId("boss-z1"), alice, bob, { since: "2020" }))
      .addEdge(new Boss(makeBossId("boss-z2"), alice, carol, { since: "2021" }));

    expect(() => builder.freeze()).toThrow(/zeroOrOne/);
  });
});

describe("Graph.edgesFrom の多重度別の戻り値", () => {
  it("exactlyOne は Edge を1件そのまま返す", () => {
    const { builder, alice, eng } = buildValidOrg();
    const graph = builder.freeze();
    const belongsTo = graph.edgesFrom(alice, BelongsTo);
    expect(belongsTo.team.id).toBe(eng.id);
  });

  it("zeroOrOne は Edge か undefined を返す", () => {
    const { builder, alice, bob, carol } = buildValidOrg();
    const graph = builder.freeze();

    const bobBoss = graph.edgesFrom(bob, Boss);
    expect(bobBoss?.superior.id).toBe(alice.id);

    const carolBoss = graph.edgesFrom(carol, Boss);
    expect(carolBoss).toBeUndefined();
  });

  it("many は readonly 配列を返す", () => {
    const { builder, alice } = buildValidOrg();
    const graph = builder.freeze();

    const friends = graph.edgesFrom(alice, Friends);
    expect(friends).toHaveLength(2);
  });
});
