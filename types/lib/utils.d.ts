declare function escapeIdentifier(name: string): string;

declare function escapeKey(
  key: string,
  escapeIdentifier: (id: string) => string
): string;

declare function mapJoinIterable<T>(
  val: Iterable<T>,
  mapper: (val: T) => string,
  sep: string
): string;

declare function joinIterable<T>(val: Iterable<T>, sep: string): string;
