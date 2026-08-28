// Node / Edge の識別子を branded string として区別するための補助型。
// TypeScript は structural typing のため、`type PersonId = string` のような
// 素の別名だけでは PersonId と TeamId が区別されない。実行時には存在しない
// unique symbol のフィールドを型にだけ足すことで、区別可能な (nominal な)
// 文字列型を作る。

declare const idBrand: unique symbol;

export type Id<Tag extends string> = string & {
  readonly [idBrand]: Tag;
};

// Tag は呼び出し側が明示する (`idOf<"PersonId">("p1")`)。
// 型引数からしか Tag を決定できないため、値からの推論はできない。
export function idOf<Tag extends string>(value: string): Id<Tag> {
  return value as Id<Tag>;
}
