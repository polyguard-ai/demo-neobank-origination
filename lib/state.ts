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
  affidavitUrl?: string;
  affidavitUuid?: string;
  verification?: Record<string, unknown>;
  event?: 'trust_check.completed' | 'trust_check.failed';
  reason?: string | null;
};

type AppState = {
  applicant: Partial<Applicant>;
  verification?: VerificationSnapshot;
  account?: { accountNumber: string; routing: string; txId: string };
  docsCollapsed: boolean;
  setApplicant: (patch: Partial<Applicant>) => void;
  setVerification: (v: VerificationSnapshot) => void;
  setAccount: (a: { accountNumber: string; routing: string; txId: string }) => void;
  toggleDocs: () => void;
  setDocsCollapsed: (collapsed: boolean) => void;
  reset: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      applicant: {},
      docsCollapsed: false,
      setApplicant: (patch) => set((s) => ({ applicant: { ...s.applicant, ...patch } })),
      setVerification: (verification) => set({ verification }),
      setAccount: (account) => set({ account }),
      toggleDocs: () => set((s) => ({ docsCollapsed: !s.docsCollapsed })),
      setDocsCollapsed: (docsCollapsed) => set({ docsCollapsed }),
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
    },
  ),
);
