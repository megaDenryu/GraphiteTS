import { Node } from "../src/node.js";
import type { Id } from "../src/id.js";

// この schema (org.ts) の ID 方針: すべて branded Id<Tag> (../src/id.js) にする、
// という決定をここで1回だけ宣言する。ライブラリ側の Node (../src/node.js) が
// ID に要求するのは string | number という「同一性のキーになれること」だけで
// あり、branded であることまでは要求しない。branded を必須にするかどうかは
// schema 側の決定であり、その宣言場所がこの基底クラスである。
//
// 辺 (BelongsTo/Boss/Friends、org.ts) 側は ExactlyOneEdge/ZeroOrOneEdge/
// ManyEdge という多重度クラスの継承と両立させる同様の基底がクラスごとに3本
// 必要になり、検証としては過剰である。ノード側だけで方針宣言の形を示す。
export abstract class OrgNodeBase<NodeId extends Id<string>> extends Node<NodeId> {}
