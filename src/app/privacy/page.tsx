import { ProsePage } from "@/components/prose-page";
import { brand } from "@/config/brand";

export const metadata = { title: "Privacy notice" };

export default function PrivacyPage() {
  return (
    <ProsePage title="Privacy notice" updated="12 November 2026">
      <p>This notice explains, in plain language, what data {brand.name} processes and why. It is written for parents and guardians.</p>
      <h2>Who controls the account</h2>
      <p>Only adults (18+) can create an account. The parent or guardian gives consent for their child&apos;s learning data to be processed when they create the account and add a child profile.</p>
      <h2>Data we collect</h2>
      <ul>
        <li>Parent: name, email, country, password (stored as a secure hash), parent PIN (hashed), consent records.</li>
        <li>Child: nickname, birth year, interests, avatar, and learning records (answers, time spent, skill progress).</li>
      </ul>
      <h2>Why we use it</h2>
      <ul>
        <li>To provide the learning service and adapt it to your child (contract).</li>
        <li>To show you progress reports (contract).</li>
        <li>To keep the service secure (legitimate interest).</li>
      </ul>
      <p>We never sell data, never use it for advertising and never build marketing profiles of children.</p>
      <h2>Your rights</h2>
      <ul>
        <li>Download all your family&apos;s data as a file from Settings.</li>
        <li>Delete a child profile, or your whole account, from the parent area. Deletion is immediate and permanent.</li>
        <li>Contact us to correct data or ask questions.</li>
      </ul>
      <h2>Retention</h2>
      <p>Data is kept while the account is active. Sessions expire automatically. When you delete an account, all associated child data is removed.</p>
    </ProsePage>
  );
}
