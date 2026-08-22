type Component<T> = {
  [P in keyof T]: T[P];
} & { $template: string; }