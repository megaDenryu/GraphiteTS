import { AnyNode } from "./node.js";
import { AnyEdge, EdgeConstructor, isExactlyOneEdgeClass, isZeroOrOneEdgeClass } from "./edge.js";

interface EdgeGroup<E extends AnyEdge> {
  readonly edgeClass: EdgeConstructor<E>;
  readonly fromId: string;
  readonly matches: E[];
}

// GraphBuilder.freeze() の検証本体を担当する。addNode/addEdge で集めた
// nodesById/edgesById のスナップショットに対して、endpoint 存在・多重度の
// 上限・下限を検査する。「多重度検証」という1つの責務を持つため、
// mutable な組み立て (GraphBuilder) とは別の型として切り出している。
export class MultiplicityValidator<
  N extends AnyNode,
  E extends AnyEdge,
> {
  private readonly groups: ReadonlyMap<string, EdgeGroup<E>>;

  constructor(
    private readonly nodesById: ReadonlyMap<string, N>,
    private readonly edgesById: ReadonlyMap<string, E>,
  ) {
    this.groups = this.groupEdgesByClassAndFrom();
  }

  validate(): void {
    this.validateEndpointsExist();
    this.validateMultiplicityUpperBound();
    this.validateMultiplicityLowerBound();
  }

  private groupEdgesByClassAndFrom(): ReadonlyMap<string, EdgeGroup<E>> {
    const groups = new Map<string, EdgeGroup<E>>();
    for (const edge of this.edgesById.values()) {
      const edgeClass = edge.constructor as EdgeConstructor<E>;
      const fromId = String(edge.from.id);
      const key = `${edgeClass.name}:${fromId}`;
      const group = groups.get(key);
      if (group) {
        group.matches.push(edge);
      } else {
        groups.set(key, { edgeClass, fromId, matches: [edge] });
      }
    }
    return groups;
  }

  private validateEndpointsExist(): void {
    for (const edge of this.edgesById.values()) {
      const fromKey = String(edge.from.id);
      const toKey = String(edge.to.id);
      if (!this.nodesById.has(fromKey)) {
        throw new Error(`freeze: edge "${String(edge.id)}" の from ノード "${fromKey}" が Graph に存在しない`);
      }
      if (!this.nodesById.has(toKey)) {
        throw new Error(`freeze: edge "${String(edge.id)}" の to ノード "${toKey}" が Graph に存在しない`);
      }
    }
  }

  // 上限検査: 追加済みの edge だけを見て、exactlyOne/zeroOrOne が
  // 1件を超えていないかを確認する。
  private validateMultiplicityUpperBound(): void {
    for (const { edgeClass, fromId, matches } of this.groups.values()) {
      if (isExactlyOneEdgeClass(edgeClass) && matches.length !== 1) {
        throw new Error(
          `freeze: 多重度違反(exactlyOne)。${edgeClass.name} はノード "${fromId}" から ${matches.length} 件出ている`,
        );
      }
      if (isZeroOrOneEdgeClass(edgeClass) && matches.length > 1) {
        throw new Error(
          `freeze: 多重度違反(zeroOrOne)。${edgeClass.name} はノード "${fromId}" から ${matches.length} 件出ている`,
        );
      }
    }
  }

  // 下限検査: exactlyOne の edge class が domainNodeClass を宣言している場合に限り、
  // その Node 部分型に属する全ノードが厳密に1件の edge を持つかを確認する。
  // domainNodeClass は From 型引数が実行時に消えることを補うための静的プロパティ
  // (edge.ts 参照)。宣言していない edge class、および1件も追加されなかった
  // edge class は上限検査だけで済ませる (README「既知の限界」参照)。
  private validateMultiplicityLowerBound(): void {
    const exactlyOneClasses = new Set<EdgeConstructor<E>>();
    for (const { edgeClass } of this.groups.values()) {
      if (isExactlyOneEdgeClass(edgeClass)) {
        exactlyOneClasses.add(edgeClass);
      }
    }

    for (const edgeClass of exactlyOneClasses) {
      const domainNodeClass = edgeClass.domainNodeClass;
      if (domainNodeClass === undefined) {
        continue;
      }
      for (const node of this.nodesById.values()) {
        if (!(node instanceof domainNodeClass)) {
          continue;
        }
        const fromId = String(node.id);
        const count = this.groups.get(`${edgeClass.name}:${fromId}`)?.matches.length ?? 0;
        if (count !== 1) {
          throw new Error(
            `freeze: 多重度違反(exactlyOne)。${edgeClass.name} はノード "${fromId}" から ${count} 件しか出ていない(1件必要)`,
          );
        }
      }
    }
  }
}
