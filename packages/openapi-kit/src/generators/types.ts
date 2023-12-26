export interface GeneratorOptions {
  /**
   * Where the generated file should be written to.
   */
  outputFilePath: string
  /**
   * Whether the output should be formatted
   * using Prettier or not.
   *
   * Disabling this option will result in
   * faster generation.
   *
   * @default false
   */
  prettyOutput?: boolean
}
