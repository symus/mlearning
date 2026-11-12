import { ProsePage } from "@/components/prose-page";
import { brand } from "@/config/brand";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <ProsePage title="Terms of use" updated="12 November 2026">
      <p>These terms apply between {brand.name} and the adult who creates the account.</p>
      <h2>Accounts</h2>
      <p>You must be 18 or older and the parent or legal guardian of any child whose profile you create. Keep your password and parent PIN private.</p>
      <h2>Plans</h2>
      <p>The Free plan is free. Paid plans renew each period until cancelled, at the price shown for your country before you subscribe. There are no hidden fees.</p>
      <h2>Educational content</h2>
      <p>We work hard to keep content accurate. {brand.name} supports learning; it does not diagnose learning needs or guarantee specific academic results.</p>
      <h2>Fair use</h2>
      <p>Content is for personal family use. Please do not copy or redistribute it.</p>
    </ProsePage>
  );
}
