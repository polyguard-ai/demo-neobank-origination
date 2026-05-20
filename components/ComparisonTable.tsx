import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

type Row = {
  capability: string;
  legacy: 'yes' | 'no' | 'partial';
  legacyNote: string;
  polyguard: 'yes' | 'no' | 'partial';
  polyguardNote: string;
};

const ROWS: Row[] = [
  {
    capability: 'Confirms the document is real',
    legacy: 'yes',
    legacyNote: 'OCR + database lookup',
    polyguard: 'yes',
    polyguardNote: 'Cryptographic NFC verification of the chip',
  },
  {
    capability: 'Confirms the person matches the document',
    legacy: 'partial',
    legacyNote: 'Selfie-vs-photo, often spoofable',
    polyguard: 'yes',
    polyguardNote: 'Live 3D facial recognition, 98%+ certainty',
  },
  {
    capability: 'Confirms a real device, not an emulator',
    legacy: 'no',
    legacyNote: 'No device attestation',
    polyguard: 'yes',
    polyguardNote: 'Apple AppAttest / Google Play Integrity',
  },
  {
    capability: 'Confirms the person is physically at the device',
    legacy: 'no',
    legacyNote: 'Blind to remote-access attacks',
    polyguard: 'yes',
    polyguardNote: 'PG-Presence optical distance bounding',
  },
  {
    capability: 'Re-verifies identity on every high-value action',
    legacy: 'no',
    legacyNote: 'Point-in-time onboarding only',
    polyguard: 'yes',
    polyguardNote: 'Continuous verification, ~100ms per check',
  },
  {
    capability: 'Produces a court-admissible record',
    legacy: 'no',
    legacyNote: 'Audit logs only',
    polyguard: 'yes',
    polyguardNote: 'Transaction Affidavit, NY CPLR § 3122-a',
  },
  {
    capability: 'Keeps biometrics off your servers',
    legacy: 'no',
    legacyNote: 'Often stored or processed centrally',
    polyguard: 'yes',
    polyguardNote: 'Privacy First — biometrics stay on device',
  },
];

export function ComparisonTable() {
  return (
    <div className="space-y-4">
      {/* Desktop: side-by-side table */}
      <table className="hidden md:table w-full border-separate border-spacing-y-2 text-sm">
        <thead>
          <tr className="text-left text-charcoal-soft uppercase text-[0.7rem] tracking-wider">
            <th className="px-3 py-1.5 font-medium w-[42%]">Capability</th>
            <th className="px-3 py-1.5 font-medium">Legacy KYC</th>
            <th className="px-3 py-1.5 font-medium">Polyguard</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.capability} className="bg-beige-light">
              <td className="px-3 py-3 align-top font-medium rounded-l-md">
                {r.capability}
              </td>
              <td className="px-3 py-3 align-top">
                <Mark v={r.legacy} />
                <p className="text-xs text-charcoal-soft mt-1">{r.legacyNote}</p>
              </td>
              <td className="px-3 py-3 align-top rounded-r-md">
                <Mark v={r.polyguard} />
                <p className="text-xs text-charcoal-soft mt-1">{r.polyguardNote}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-3">
        {ROWS.map((r) => (
          <div key={r.capability} className="card">
            <p className="font-medium">{r.capability}</p>
            <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-charcoal-soft mb-1">
                  Legacy KYC
                </p>
                <Mark v={r.legacy} />
                <p className="mt-1 text-charcoal-soft">{r.legacyNote}</p>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-sage-strong mb-1">
                  Polyguard
                </p>
                <Mark v={r.polyguard} />
                <p className="mt-1 text-charcoal-soft">{r.polyguardNote}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Mark({ v }: { v: 'yes' | 'no' | 'partial' }) {
  if (v === 'yes')
    return (
      <span className="inline-flex items-center gap-1 text-sage-strong text-xs font-medium">
        <CheckCircle2 className="h-4 w-4" />
        Yes
      </span>
    );
  if (v === 'no')
    return (
      <span className="inline-flex items-center gap-1 text-error text-xs font-medium">
        <XCircle className="h-4 w-4" />
        No
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-warning text-xs font-medium">
      <MinusCircle className="h-4 w-4" />
      Partial
    </span>
  );
}
