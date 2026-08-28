import { Node } from "./node.js";
import { Edge, EdgeConstructor, isExactlyOneEdgeClass, isZeroOrOneEdgeClass } from "./edge.js";
import { TraversalResult } from "./traversal.js";

// 完成した不変な Graph。GraphBuilder.freeze() が返す唯一の生成経路であり、
// このクラスを直接 `new` することは想定していない (コンストラクタは
// builder.ts からの呼び出し専用)。
export class Graph<
  N extends Node<any>,
  E extends Edge<any, any, any, any>,
> {
  private readonly nodesById: ReadonlyMap<string, N>;
  private readonly edgeList: readonly E[];

  constructor(nodes: readonly N[], edges: readonly E[]) {
    const map = new Map<string, N>();
    for (const node of nodes) {
      map.set(String(node.id), node);
    }
    this.nodesById = map;
    this.edgeList = edges;
  }

  nodes(): readonly N[] {
    return [...this.nodesById.values()];
  }

  edges(): readonly E[] {
    return this.edgeList;
  }

  nodeById(id: string): N | undefined {
    return this.nodesById.get(id);
  }

  // 多重度によって戻り値の形が変わる中核 API。
  // edgeClass に渡した Edge subclass の multiplicityBrand を実行時に判定し、
  // TraversalResult<InstanceType<C>> (E / E | undefined / readonly E[]) を返す。
  edgesFrom<C extends EdgeConstructor<E>>(
    fromNode: N,
    edgeClass: C,
  ): TraversalResult<InstanceType<C>> {
    const fromId = String(fromNode.id);
    const matches = this.edgeList.filter(
      (edge): edge is InstanceType<C> =>
        edge instanceof edgeClass && String(edge.from.id) === fromId,
    );

    if (isExactlyOneEdgeClass(edgeClass)) {
      const [only] = matches;
      if (matches.length !== 1 || only === undefined) {
        throw new Error(
          `edgesFrom: ノード "${fromId}" に対する ${edgeClass.name} の多重度違反(exactlyOne)。実際は ${matches.length} 件`,
        );
      }
      return only as TraversalResult<InstanceType<C>>;
    }

    if (isZeroOrOneEdgeClass(edgeClass)) {
      if (matches.length > 1) {
        throw new Error(
          `edgesFrom: ノード "${fromId}" に対する ${edgeClass.name} の多重度違反(zeroOrOne)。実際は ${matches.length} 件`,
        );
      }
      return matches[0] as TraversalResult<InstanceType<C>>;
    }

    return matches as TraversalResult<InstanceType<C>>;
  }
}
