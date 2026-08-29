# GraphiteTS

Graphite の [issue #23](https://github.com/megaDenryu/Graphite/issues/23)
「TypeScriptの通常型システムだけでschema graphを表現できるか検証する」のための
検証プロジェクトである。TypeScript の拡張構文・コード生成 (proc macro 相当) を
一切使わず、通常の class / 継承 / union type / generics / conditional type だけで
Graphite のグラフ意味論 (Node/Edge の nominal 型、schema による Node/Edge 集合の
制限、multiplicity-aware な辿り API、Builder/freeze の二段階構築) をどこまで
表現できるかを見る。TypeScript 版 Graphite を実装することが目的ではない。

## 実行方法

```
cd C:\devs\GraphiteTS
npm install
npm run typecheck
npm run test
```

- `npm run typecheck` は `tsc --noEmit`。schema 外の Node/Edge を書いた行に
  `@ts-expect-error` を付けたテストが実際にコンパイルエラーになっているかまで
  この段階で検査する
- `npm run test` は `vitest run`。Builder→freeze の実行時検証と、
  多重度ごとの辿り API の戻り値を検証する

## 構成

```
src/
  id.ts         branded type による nominal な ID 補助型 (Id<Tag>, idOf)
  node.ts       abstract class Node<Id>
  edge.ts       abstract class Edge<Id, From, To, Payload> と
                多重度サブクラス ExactlyOneEdge / ZeroOrOneEdge / ManyEdge
  traversal.ts  EdgeFrom/EdgeTo/EdgePayload/EdgeNodes と、
                多重度から辿り API の戻り値型を導く TraversalResult<E>
  graph.ts      不変な Graph<N, E> と edgesFrom
  builder.ts    GraphBuilder<N, E> と freeze()、createGraph (endpoint 検査)
  multiplicity-validation.ts
                freeze() が呼ぶ多重度・endpoint の検証本体 (MultiplicityValidator)
  index.ts      re-export
examples/
  org-ids.ts    org.ts が使う ID 型 (PersonId 等) と生成関数 (makePersonId 等)
  org-base.ts   OrgNodeBase (この schema の ID 方針宣言。branded Id<Tag> を必須にする)
  org.ts        issue 本文の Person/Team/BelongsTo/Boss/Friends の例
  orgGraph.ts   `class OrgGraph extends Graph<OrgNode, OrgEdge> {}` の例
tests/
  type-level.test.ts  コンパイル時検査 (@ts-expect-error) + conditional type の等値検査
  runtime.test.ts     Builder/freeze の実行時検証、edgesFrom の戻り値検証
```

## issue チェックリストの達成状況

| # | 項目 | 状況 | 根拠 |
|---|---|---|---|
| 1 | `Graph<NodeUnion, EdgeUnion>` で schema の Node/Edge 集合を表現できる | 達成 | `examples/orgGraph.ts` の `class OrgGraph extends Graph<OrgNode, OrgEdge> {}` が typecheck を通る |
| 2 | schema 外の Node/Edge を compile error にできる | 達成 | `tests/type-level.test.ts` で `GraphBuilder.addNode/addEdge` に schema 外の `Project`/`Friendship` を渡す行が `@ts-expect-error` として検査される |
| 3 | Edge の endpoint type が Node union に含まれることを型で検査できる | 達成 | `src/builder.ts` の `createGraph` が rest parameter の tuple 型 (`EdgeNodes<E> extends N ? [] : [...]`) で検査する。`createGraph<Person, BelongsTo>()` (Team 抜き) が `@ts-expect-error` になることをテストで確認 |
| 4 | Edge subclass から From/To/Payload を conditional type で取り出せる | 達成 | `src/traversal.ts` の `EdgeFrom`/`EdgeTo`/`EdgePayload`。`tests/type-level.test.ts` で `Equal<EdgeFrom<BelongsTo>, Person>` 等を検査 |
| 5 | endpoint role を Edge subclass の nominal API として自然に表現できる | 達成 | `examples/org.ts` の `BelongsTo.member/team`、`Boss.subordinate/superior` 等の getter |
| 6 | ExactlyOne/ZeroOrOne/Many 等の multiplicity を通常の継承階層へ載せられる | 達成 | `src/edge.ts` の3つの抽象クラス。`declare readonly multiplicityBrand` で structural typing による誤認を防ぐ nominal brand にした |
| 7 | multiplicity から traversal の戻り値 `T / T \| undefined / readonly T[]` を推論できる | 達成 | `src/traversal.ts` の `TraversalResult<E>` と `Graph.edgesFrom`。`tests/runtime.test.ts` で3種の戻り値をすべて確認 |
| 8 | branded type 等により NodeId/EdgeId の nominality を十分保てる | 達成 | `src/id.ts` の `Id<Tag>`。`PersonId`/`TeamId` 等は unique symbol の幻影フィールドで区別され、`idOf<"PersonId">(...)` でしか作れない |
| 9 | Builder/immutable Graph の分離が自然に成立する | 部分達成 | 二段階構築 (`GraphBuilder.addNode/addEdge` → `freeze()` → `Graph`) 自体は自然に成立し、endpoint 未登録・多重度の上限違反 (重複) は検出できる。ただし **multiplicity の下限 (「exactlyOne は最低1件」) は、対応する edge が1件も追加されなかった場合に検出できない** — Edge の `From` 型引数は実行時に消えるため、`GraphBuilder` は「schema にどの edge class が存在するか」を、実際に1件以上追加された edge からしか知る手段がない。回避策として `BelongsTo` に `static readonly domainNodeClass = Person` という任意の静的プロパティを持たせ、1件でも追加されていれば「対象ノード全員が持っているか」まで検証できるようにした (`src/multiplicity-validation.ts` の `validateMultiplicityLowerBound`) が、これはあくまで緩和であり型システムだけの帰結ではない |
| 10 | conditional type/generic が過剰に複雑化せず、利用コードが読める範囲に収まる | 達成 | `examples/org.ts`・`examples/orgGraph.ts` は generic の明示的型引数と class 継承だけで書けており、conditional type ( `EdgeFrom`/`TraversalResult`/`EdgeNodes` ) は `src/` 側に閉じている。利用者が直接 conditional type を書く必要があるのは `createGraph<N, E>()` の型引数指定だけ |

## 設計上の発見 (Rust 版との差分)

- **ID の nominality は Node/Edge の nominal 分離を兼ねる。** Rust 版のように
  Node 自体に専用の brand を持たせなくても、`id` フィールドの branded type が
  異なれば `Person` と `Team` は structural typing 上でも区別された。ただし
  multiplicity サブクラス (`ExactlyOneEdge`/`ZeroOrOneEdge`) は From/To/Payload が
  同じ形になり得るため、こちらは `declare readonly multiplicityBrand` という
  専用の nominal brand が必須だった
- **schema (Node/Edge 集合) は「型」であって「値」ではない。** Rust 版は
  `graph_schema!` が実行時にも参照できる指紋・生成コードを持つが、TypeScript 版の
  `Graph<N, E>` は型引数として消え、実行時には `GraphBuilder`/`Graph` が保持する
  Map/配列だけが実体になる。このため「schema にどの edge class が存在するか」を
  実行時に問うことができず、上記チェックリスト9の限界に直結した
  (Rust 版は proc macro が展開時に schema 全体を静的に把握できるため、この種の
  限界を原理的に持たない)
- **rest parameter の tuple 型による compile error trick (`createGraph`) は
  実用に足る。** 型だけで「引数を渡せなくする」ことで compile error を発生させる
  手法は、Rust の `where` 節による制約検査とは異なる仕組みだが、利用者から見た
  体験 (schema 違反が赤い波線になる) はほぼ同等だった
- **「Node と ID の関係」は3つの決定に分かれ、TS 版はその3つに別々の
  持ち主が要る。** (1) 各ノードの束縛 — `Person` が `extends OrgNodeBase<PersonId>`
  と書く (`examples/org.ts`)。(2) ライブラリの能力契約 — `Node<NodeId extends
  string | number>` (`src/node.ts`) が要求するのは「同一性のキーになれること」
  だけであり、branded であることまでは要求しない。(3) schema の ID 方針宣言 —
  「この schema では ID を branded `Id<Tag>` にする」という決定を
  `OrgNodeBase<NodeId extends Id<string>>` (`examples/org-base.ts`) が1回だけ
  宣言する。Rust 版は proc macro が schema 宣言1箇所でこの3つ全部を同時に
  持てるのに対し、TS 版は Node の型引数制約・schema 基底クラス・各ノード
  クラスの extends という3箇所へ分かれて、初めて全部に持ち主がつく
