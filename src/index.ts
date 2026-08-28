// vitest (esbuild) はファイル単体の情報だけで型/値を判別するため、
// 型だけの re-export は `export type` で分離する。値と同じ `export {}` に
// 混ぜると、実行時に存在しない名前を import しようとして壊れる。
export type { Id } from "./id.js";
export { idOf } from "./id.js";

export { Node } from "./node.js";

export { Edge, ExactlyOneEdge, ZeroOrOneEdge, ManyEdge, isExactlyOneEdgeClass, isZeroOrOneEdgeClass, isManyEdgeClass } from "./edge.js";
export type { EdgeConstructor } from "./edge.js";

export type { EdgeFrom, EdgeTo, EdgePayload, EdgeNodes, TraversalResult } from "./traversal.js";

export { Graph } from "./graph.js";

export { GraphBuilder, createGraph } from "./builder.js";

export { MultiplicityValidator } from "./multiplicity-validation.js";
