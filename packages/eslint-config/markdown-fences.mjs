import markdown from '@eslint/markdown';

const fenceProcessor = markdown.processors.markdown;

/**
 * The `markdown/markdown` processor, extended to lint the Markdown file
 * itself as well as its fences. The stock processor returns only the
 * fenced blocks, so a `.md` file it runs on is never linted as Markdown
 * and `markdown/recommended` goes silent over it. The whole text goes
 * first and its messages come back unchanged; the fence messages go
 * through the stock `postprocess`, which maps them back onto the file.
 *
 * @type {import("eslint").Linter.Processor} */
export const markdownWithFences = {
  meta: { name: 'markdown-with-fences' },
  supportsAutofix: true,
  preprocess: (text, filename) => [text, ...fenceProcessor.preprocess(text, filename)],
  postprocess: ([fileMessages = [], ...fenceMessages], filename) => [
    ...fileMessages,
    ...fenceProcessor.postprocess(fenceMessages, filename),
  ],
};

/**
 * The Markdown-fences flavor: lints the `js` and `ts` fences of every
 * Markdown file with the code rules, as virtual children such as
 * `README.md/0.ts`, while the file itself is still linted as Markdown.
 * Lay it over `./base.mjs`. A project whose fences import its own
 * packages, unresolved before a build, adds an `import/no-unresolved`
 * ignore for `**\/*.md/*.ts` in its own config.
 *
 * @type {import("eslint").Linter.Config[]} */
export default [
  {
    files: ['**/*.md'],
    processor: markdownWithFences,
  },
];
