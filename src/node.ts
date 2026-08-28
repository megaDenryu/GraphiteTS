// Graphite の Node に相当する抽象基底クラス。
// Id 型引数に branded type (id.ts の Id<Tag>) を渡すことで、
// 同じ形の Node 派生クラス同士も id フィールドの型で区別される。
export abstract class Node<NodeId> {
  constructor(readonly id: NodeId) {}
}
