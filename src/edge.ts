import { Node } from "./node.js";

// Graphite の Edge に相当する抽象基底クラス。
// From / To を Node<any> の具象部分型に固定することで、endpoint の型が
// Edge subclass の宣言そのものに残る (traversal.ts の EdgeNodes<E> が
// これを conditional type で取り出す)。
export abstract class Edge<
  EdgeId,
  From extends Node<any>,
  To extends Node<any>,
  Payload = undefined,
> {
  constructor(
    readonly id: EdgeId,
    readonly from: From,
    readonly to: To,
    readonly payload: Payload,
  ) {}
}

// 多重度 (multiplicity) を表す3つの抽象クラス。
// `declare readonly multiplicityBrand` は実行時には存在しないフィールド宣言で、
// ExactlyOneEdge と ZeroOrOneEdge は From/To/Payload が同じ形でも
// structural typing で混同されないようにする nominal brand として働く。
export abstract class ExactlyOneEdge<
  EdgeId,
  From extends Node<any>,
  To extends Node<any>,
  Payload = undefined,
> extends Edge<EdgeId, From, To, Payload> {
  declare readonly multiplicityBrand: "exactlyOne";
}

export abstract class ZeroOrOneEdge<
  EdgeId,
  From extends Node<any>,
  To extends Node<any>,
  Payload = undefined,
> extends Edge<EdgeId, From, To, Payload> {
  declare readonly multiplicityBrand: "zeroOrOne";
}

export abstract class ManyEdge<
  EdgeId,
  From extends Node<any>,
  To extends Node<any>,
  Payload = undefined,
> extends Edge<EdgeId, From, To, Payload> {
  declare readonly multiplicityBrand: "many";
}

// Edge のコンストラクタ (class そのもの) を値として受け渡すための型。
// `graph.edgesFrom(node, BelongsTo)` のように class を渡すと、
// InstanceType<C> で具体的な Edge subclass の型を取り出せる。
// domainNodeClass は任意で、freeze() が exactlyOne の下限 (最低1件) を
// 検査したいときに、どの Node 集合が「対象」かを実行時に知るための宣言。
// 型パラメータの From だけでは実行時に消えてしまうため、この静的プロパティで
// 補う。省略した edge class は上限検査 (重複禁止) だけが行われる。
export type EdgeConstructor<
  E extends Edge<any, any, any, any> = Edge<any, any, any, any>,
> = (new (...args: any[]) => E) & {
  readonly domainNodeClass?: new (...args: any[]) => Node<any>;
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
