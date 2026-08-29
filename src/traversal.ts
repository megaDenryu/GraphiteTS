import { Edge, ExactlyOneEdge, ZeroOrOneEdge, ManyEdge } from "./edge.js";
import { AnyNode } from "./node.js";

// Edge subclass の型引数から From/To/Payload を取り出す conditional type。
// createGraph (builder.ts) の endpoint 検査でも使う。
// 抽出しない位置には `any` でなく、Edge の型パラメータ制約を満たす具体的な
// 上限 (EdgeId は string | number、From/To は AnyNode、Payload は unknown)
// を渡す。これらは制約そのものか制約に整合する型なので、conditional type の
// pattern matching としては `any` を使う場合と同じ結果になる。
export type EdgeFrom<E> = E extends Edge<string | number, infer From, AnyNode, unknown> ? From : never;
export type EdgeTo<E> = E extends Edge<string | number, AnyNode, infer To, unknown> ? To : never;
export type EdgePayload<E> = E extends Edge<string | number, AnyNode, AnyNode, infer Payload> ? Payload : never;

export type EdgeNodes<E> = E extends Edge<string | number, infer From, infer To, unknown>
  ? From | To
  : never;

// 多重度 (ExactlyOne / ZeroOrOne / Many) から traversal API の戻り値型を導く。
// Graph.edgesFrom (graph.ts) の戻り値型はこれをそのまま使う。
export type TraversalResult<E> = E extends ExactlyOneEdge<string | number, AnyNode, AnyNode, unknown>
  ? E
  : E extends ZeroOrOneEdge<string | number, AnyNode, AnyNode, unknown>
    ? E | undefined
    : E extends ManyEdge<string | number, AnyNode, AnyNode, unknown>
      ? readonly E[]
      : never;
