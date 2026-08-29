// Graphite の Node に相当する抽象基底クラス。
// Id 型引数に branded type (id.ts の Id<Tag>) を渡すことで、
// 同じ形の Node 派生クラス同士も id フィールドの型で区別される。
//
// NodeId が string | number に制約されているのは、ライブラリ (この Node) が
// ID に要求するのが「同一性のキーになれること」だけであり、branded であるかは
// 要求しないためである。branded 必須にするかどうかは schema 側の決定であり、
// examples/org-base.ts の OrgNodeBase がその決定を宣言する。この string | number
// という範囲は、Graph (graph.ts) が String(id) でキー化する実装に対して正直な
// 制約でもあり、オブジェクトを ID にすると "[object Object]" へ潰れて別ノードと
// 衝突する事故を型で防ぐ。
export abstract class Node<NodeId extends string | number> {
  constructor(readonly id: NodeId) {}
}

// N extends AnyNode という書き方で「Node の具象部分型なら何でもよい」を表す別名。
// 素の Node<any> と違い、ID 位置の制約 (string | number) が保たれたまま
// any を消せる。readonly フィールドの共変性により、具象 Node 派生は
// すべてこの別名へ代入可能である。
export type AnyNode = Node<string | number>;
