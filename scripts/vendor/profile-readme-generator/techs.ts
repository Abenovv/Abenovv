// SPDX-License-Identifier: MIT
// Mauro de Souza/profile-readme-generator, src/features/techs/parser.ts.
// Reviewed adaptation: local icon types/paths; spacing uses nonbreaking spaces instead of source-less images.
const Sections = { TECHS: 'techs' };
type EditableIcon = {
 providers: Array<{path?: string; variants?: string[]}>;
 currentProvider: number;
 config: Record<number, {variant?: number}>;
};

type TechStyles = {
  height: number;
};

type Content = {
  icons: Record<string, EditableIcon>;
  styles: TechStyles;
};

type SectionStyles = {
  align: 'left' | 'center' | 'right';
  spacing: number;
};

type TechsSectionParserArgs = {
  content: Content;
  styles: SectionStyles;
};

const techsSectionParser = ({
  content,
  styles: sectionStyles,
}: TechsSectionParserArgs) => {
  const { icons, styles } = content;

  const { align, spacing } = sectionStyles;
  const { height = 40 } = styles;

  const imgsHtml = Object.entries(icons)
    .reduce(
      (html, [icon, { providers, currentProvider, config }], index, arr) => {
        const isLast = index === arr.length - 1;
        const provider = providers[currentProvider]!;

        const providerVariants = provider.variants || [];
        const hasVariants = !!providerVariants.length;

        const logo = hasVariants
          ? providerVariants[(config[currentProvider]?.variant ?? 0) as number]
          : provider!.path;

        const space = '&nbsp;'.repeat(Math.max(0, Math.round(spacing / 4)));
        const img = `<img src="${logo}" height="${height}" alt="${icon} logo" />`;

        return `${html} \n ${img}` + (!isLast ? ` \n ${space}` : '');
      },
      ''
    )
    .trim();

  return `
    <div data-importer="${Sections.TECHS}" align="${align}">
      ${imgsHtml}
    </div>
  `;
};

export { techsSectionParser };

