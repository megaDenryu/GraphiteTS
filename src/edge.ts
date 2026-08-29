import { AnyNode } from "./node.js";

// Graphite の Edge に相当する抽象基底クラス。
// From / To を AnyNode (= Node<string | number>) の具象部分型に固定することで、
// endpoint の型が Edge subclass の宣言そのものに残る (traversal.ts の
// EdgeNodes<E> がこれを conditional type で取り出す)。EdgeId も Node と同じ
// 理由 (同一性のキーになれることだけを要求し、branded かどうかは問わない) で
// string | number に制約する。
export abstract class Edge<
  EdgeId extends string | number,
  From extends AnyNode,
  To extends AnyNode,
  Payload = undefined,
> {
  constructor(
    readonly id: EdgeId,
    readonly from: From,
    readonly to: To,
    readonly payload: Payload,
  ) {}
}

// E extends AnyEdge という書き方で「Edge の具象部分型なら何でもよい」を表す別名。
// Payload には制約が無いため unknown を渡す。readonly フィールドの共変性により、
// 具象 Edge 派生 (多重度サブクラスを含む) はすべてこの別名へ代入可能である。
export type AnyEdge = Edge<string | number, AnyNode, AnyNode, unknown>;

// 多重度 (multiplicity) を表す3つの抽象クラス。
// `declare readonly multiplicityBrand` は実行時には存在しないフィールド宣言で、
// ExactlyOneEdge と ZeroOrOneEdge は From/To/Payload が同じ形でも
// structural typing で混同されないようにする nominal brand として働く。
export abstract class ExactlyOneEdge<
  EdgeId extends string | number,
  From extends AnyNode,
  To extends AnyNode,
  Payload = undefined,
> extends Edge<EdgeId, From, To, Payload> {
  declare readonly multiplicityBrand: "exactlyOne";
}

export abstract class ZeroOrOneEdge<
  EdgeId extends string | number,
  From extends AnyNode,
  To extends AnyNode,
  Payload = undefined,
> extends Edge<EdgeId, From, To, Payload> {
  declare readonly multiplicityBrand: "zeroOrOne";
}

export abstract class ManyEdge<
  EdgeId extends string | number,
  From extends AnyNode,
  To extends AnyNode,
  Payload = undefined,
> extends Edge<EdgeId, From, To, Payload> {
  declare readonly multiplicityBrand: "many";
}

// Edge のコンストラクタ (class そのもの) を値として受け渡すための型。
// `graph.edgesFrom(node, BelongsTo)` のように class を渡すと、
// InstanceType<C> で具体的な Edge subclass の型を取り出せる。
// コンストラクタ引数の位置は反変であるため、`never[]` (どんな引数列の
// 部分型でもある) を使うことで `any[]` より厳格に「引数の中身は問わない」
// を表せる。
// domainNodeClass は任意で、freeze() が exactlyOne の下限 (最低1件) を
// 検査したいときに、どの Node 集合が「対象」かを実行時に知るための宣言。
// 型パラメータの From だけでは実行時に消えてしまうため、この静的プロパティで
// 補う。省略した edge class は上限検査 (重複禁止) だけが行われる。
export type EdgeConstructor<
  E extends AnyEdge = AnyEdge,
> = (new (...args: never[]) => E) & {
  readonly domainNodeClass?: new (...args: never[]) => AnyNode;
};

export function isExactlyOneEdgeClass(edgeClass: Function): boolean {
  return edgeClass.prototype instanceof ExactlyOneEdge;
}

export function isZeroOrOneEdgeClass(edgeClass: Function): boolean {
  return edgeClass.prototype instanceof ZeroOrOneEdge;
}

export function isManyEdgeClass(edgeClass: Function): boolean {
  return edgeClass.prototype instanceof ManyEdge;
}
