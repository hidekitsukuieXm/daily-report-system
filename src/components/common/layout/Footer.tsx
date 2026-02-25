/**
 * フッターコンポーネント
 */

import './Footer.css';

export type FooterProps = {
  /** コピーライトテキスト */
  copyright?: string;
  /** バージョン */
  version?: string;
};

export function Footer({
  copyright = '2024 営業日報システム',
  version,
}: FooterProps) {
  const currentYear = new Date().getFullYear();
  const displayCopyright = copyright.includes(String(currentYear))
    ? copyright
    : copyright.replace(/\d{4}/, String(currentYear));

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-content">
        <p className="footer-copyright">&copy; {displayCopyright}</p>
        {version && <p className="footer-version">Version {version}</p>}
      </div>
    </footer>
  );
}
