// SPDX-License-Identifier: MIT
// Mauro de Souza/profile-readme-generator @ 10cf0a2f3bfb1672b23c7d4966673d184b26a4b4.
// Adapted 2026-10-30: use local SVGs and inline section identifier.
const url = { getSocialImg: (_type: string, social: string, _props: unknown) => `assets/socials/${social}.svg` };
const Sections = { SOCIALS: 'socials' };

type SocialStyles = {
  type: 'icon' | 'badge';
  style: string;
  height?: number;
};

type SectionStyles = {
  align: 'left' | 'center' | 'right';
  spacing: number;
};

type SocialIcon = {
  icon: string;
  link: string;
};

type SocialBadge = Record<string, string>;

type Social = SocialIcon | SocialBadge;

type Content = {
  socials: Record<string, Social>;
  styles: SocialStyles;
};

type SocialsSectionParserArgs = {
  content: Content;
  styles: SectionStyles;
};

const wrapperHtmlInLink = (link = '', html = '') => {
  return `
    <a href="${link}" target="_blank">
      ${html}
    </a>
  `;
};

const socialsSectionParser = ({
  content,
  styles: sectionStyles,
}: SocialsSectionParserArgs) => {
  const { socials, styles } = content;

  const { align, spacing } = sectionStyles;
  const { height = 40, type, style } = styles;

  const imgsHtml = Object.entries(socials)
    .reduce((html, [social, { link, ...rest }]) => {
      const props = { ...rest, style };
      const srcUrl = url.getSocialImg(type, social, props);

      const widthValue = Number(height) + Number(spacing);
      const widthAttr = type === 'icon' ? ` width="${widthValue}"` : '';

      const img = `<img src="${srcUrl}"${widthAttr} height="${height}" alt="${social} logo" />`;
      const finalHtml = link ? wrapperHtmlInLink(link, img) : img;

      return `${html}\n${finalHtml}`;
    }, '')
    .trim();

  return `
    <div data-importer="${Sections.SOCIALS}" align="${align}">
      ${imgsHtml}
    </div>
  `;
};

export { socialsSectionParser };
