import { NotFoundContent } from "@/components/layout/not-found-content";
import { SiteChrome } from "@/components/layout/site-chrome";

/** Unknown URLs anywhere on the site. */
export default function NotFound() {
  return (
    <SiteChrome>
      <NotFoundContent />
    </SiteChrome>
  );
}
