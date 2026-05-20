import { Shell } from '@/components/Shell';
import { WebhookEnrichment } from '@/components/WebhookEnrichment';

export default function OriginationLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell>
      {children}
      <WebhookEnrichment />
    </Shell>
  );
}
