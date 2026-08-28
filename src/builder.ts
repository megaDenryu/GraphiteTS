import { Node } from "./node.js";
import { Edge } from "./edge.js";
import { EdgeNodes } from "./traversal.js";
import { Graph } from "./graph.js";
import { MultiplicityValidator } from "./multiplicity-validation.js";

// mutable な組み立て段階を担う。addNode/addEdge は一時的な制約違反
// (endpoint 未登録・多重度違反) を許容し、freeze() で初めて検証する。
// 検証本体は MultiplicityValidator (multiplicity-validation.ts) に委譲する。
export class GraphBuilder<
  N extends Node<any>,
  E extends Edge<any, any, any, any>,
> {
  private readonly nodesById = new Map<string, N>();
  private readonly edgesById = new Map<string, E>();

  addNode(node: N): this {
    const key = String(node.id);
    if (this.nodesById.has(key)) {
      throw new Error(`GraphBuilder.addNode: id "${key}" は既に追加されている`);
    }
    this.nodesById.set(key, node);
    return this;
  }

  addEdge(edge: E): this {
    const key = String(edge.id);
    if (this.edgesById.has(key)) {
      throw new Error(`GraphBuilder.addEdge: id "${key}" は既に追加されている`);
    }
    this.edgesById.set(key, edge);
    return this;
  }

  freeze(): Graph<N, E> {
    new MultiplicityValidator(this.nodesById, this.edgesById).validate();
    return new Graph<N, E>([...this.nodesById.values()], [...this.edgesById.values()]);
  }
}

// Edge の endpoint (From | To) が Node 集合 N に含まれることを、
// rest parameter の tuple 型で検査する factory function。
// EdgeNodes<E> extends N が偽なら check の型が1要素の tuple になり、
// 呼び出し側は引数無しで呼べず compile error になる。
export function createGraph<
  N extends Node<any>,
  E extends Edge<any, any, any, any>,
>(
  ...check: EdgeNodes<E> extends N ? [] : ["Edge endpoint is not included in Node types"]
): GraphBuilder<N, E> {
  void check;
  return new GraphBuilder<N, E>();
}
