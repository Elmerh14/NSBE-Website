import { Mail } from 'lucide-react';
import { Link } from 'react-router';

import { useSiteSettings } from '../settings/useSiteSettings';
import { JoinButton } from './JoinButton';
import { FOOTER_LINKS, SITE_NAME, socialLinks } from './site';
import { SocialIcon } from './SocialIcon';

// Three columns (chapter name, page links, contact). On phones they stack and are centered.
// The Connect column shows only what's set on the admin Settings page.
export function SiteFooter() {
  const settings = useSiteSettings();
  const contactEmail = settings.data?.contactEmail;
  const socials = settings.data ? socialLinks(settings.data) : [];
  const hasConnect = Boolean(contactEmail ?? settings.data?.joinUrl) || socials.length > 0;

  return (
    <footer className="bg-muted/40 border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <p className="text-center text-lg font-bold md:text-left">{SITE_NAME}</p>

        {/* The heading plus seven links fill two columns of four, filled top to bottom. */}
        <nav
          aria-label="Footer"
          className="grid w-fit grid-flow-col grid-rows-4 gap-x-12 gap-y-2 justify-self-center text-center text-sm md:justify-self-start md:text-left"
        >
          <p className="text-base font-semibold">Explore</p>
          {FOOTER_LINKS.map((page) => (
            <Link
              key={page.path}
              to={page.path}
              className="text-muted-foreground hover:text-foreground"
            >
              {page.title}
            </Link>
          ))}
        </nav>

        {hasConnect && (
          <div className="flex flex-col items-center gap-3 md:items-start">
            <p className="font-semibold">Connect</p>
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
              >
                <Mail className="size-4" />
                {contactEmail}
              </a>
            )}
            {socials.length > 0 && (
              <ul className="flex gap-3">
                {socials.map((social) => (
                  <li key={social.platform}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${SITE_NAME} on ${social.label}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <SocialIcon platform={social.platform} className="size-5" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <JoinButton label="Join NSBE" className="w-fit" />
          </div>
        )}
      </div>

      <div className="border-t">
        <p className="text-muted-foreground mx-auto max-w-6xl px-4 py-4 text-center text-sm">
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
      </div>
    </footer>
  );
}
