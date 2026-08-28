// issue #23 本文の `class OrgGraph extends Graph<OrgNodes, OrgEdges> {}` を
// そのまま試したもの。Graph<N, E> の具体化だけで schema 宣言として機能するかを見る。
//
// 実際の Graph インスタンスは GraphBuilder.freeze() が返す `Graph<OrgNode, OrgEdge>`
// であり、OrgGraph 型そのものではない (freeze() は基底クラス Graph を返す)。
// OrgGraph はここでは「Node/Edge 集合を1つの名前に束ねた schema の名前」として
// 使えることの検証であり、独自のコンストラクタ・振る舞いは持たせていない。
import { Graph } from "../src/graph.js";
import type { OrgNode, OrgEdge } from "./org.js";

export class OrgGraph extends Graph<OrgNode, OrgEdge> {}
