import { Edge, ExactlyOneEdge, ZeroOrOneEdge, ManyEdge } from "./edge.js";

// Edge subclass の型引数から From/To/Payload を取り出す conditional type。
// createGraph (builder.ts) の endpoint 検査でも使う。
export type EdgeFrom<E> = E extends Edge<any, infer From, any, any> ? From : never;
export type EdgeTo<E> = E extends Edge<any, any, infer To, any> ? To : never;
export type EdgePayload<E> = E extends Edge<any, any, any, infer Payload> ? Payload : never;

export type EdgeNodes<E> = E extends Edge<any, infer From, infer To, any>
  ? From | To
  : never;

// 多重度 (ExactlyOne / ZeroOrOne / Many) から traversal API の戻り値型を導く。
// Graph.edgesFrom (graph.ts) の戻り値型はこれをそのまま使う。
export type TraversalResult<E> = E extends ExactlyOneEdge<any, any, any, any>
  ? E
  : E extends ZeroOrOneEdge<any, any, any, any>
    ? E | undefined
    : E extends ManyEdge<any, any, any, any>
      ? readonly E[]
      : never;
