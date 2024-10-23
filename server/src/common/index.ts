
export type SlashPathSplit<Path extends string> =
  Path extends '' ? never :
  Path extends `${infer S1}/${infer S2}` ? SlashPathSplit<S1> | SlashPathSplit<S2> :
  Path;
