import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

// Painted Board shell for every public page: grained paper ground,
// the sticky ruled header, the ink strip footer. The paintings change;
// the wall they hang on does not.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="site-grain flex min-h-full flex-col bg-paper font-site-body">
      <SiteHeader />
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter />
    </main>
  );
}
