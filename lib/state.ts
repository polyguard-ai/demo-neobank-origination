'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Applicant = {
  firstName: string;
  lastName: string;
  dob: string; // YYYY-MM-DD
  email: string;
  ssnLast4: string;
};

export type VerificationSnapshot = {
  linkUuid: string;
  /** Populated immediately from the SDK response. */
  source: 'sdk' | 'webhook';
  status?: 'success' | 'failure';
  reason?: string | null;
  presence?: { score: string | number; [k: string]: unknown };
  verification?: Record<string, unknown>;
  /** Webhook-only fields. */
  affidavitUrl?: string;
  affidavitUuid?: string;
  event?: 'trust_check.completed' | 'trust_check.failed';
};

type AppState = {
  applicant: Partial<Applicant>;
  verification?: VerificationSnapshot;
  account?: { accountNumber: string; routing: string; txId: string };
  docsCollapsed: boolean;
  /** True once zustand has finished rehydrating from localStorage. */
  _hasHydrated: boolean;
  setApplicant: (patch: Partial<Applicant>) => void;
  setVerification: (v: VerificationSnapshot) => void;
  setAccount: (a: { accountNumber: string; routing: string; txId: string }) => void;
  toggleDocs: () => void;
  setDocsCollapsed: (collapsed: boolean) => void;
  setHasHydrated: (h: boolean) => void;
  reset: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      applicant: {},
      docsCollapsed: false,
      _hasHydrated: false,
      setApplicant: (patch) => set((s) => ({ applicant: { ...s.applicant, ...patch } })),
      setVerification: (verification) => set({ verification }),
      setAccount: (account) => set({ account }),
      toggleDocs: () => set((s) => ({ docsCollapsed: !s.docsCollapsed })),
      setDocsCollapsed: (docsCollapsed) => set({ docsCollapsed }),
      setHasHydrated: (h) => set({ _hasHydrated: h }),
      reset: () => set({ applicant: {}, verification: undefined, account: undefined }),
    }),
    {
      name: 'beige-bank-demo',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        applicant: s.applicant,
        verification: s.verification,
        account: s.account,
        docsCollapsed: s.docsCollapsed,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

/** Subscribe to whether the persisted store has finished loading from localStorage. */
export const useHasHydrated = () => useAppStore((s) => s._hasHydrated);
