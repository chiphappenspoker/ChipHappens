'use client';

import { ToastProvider } from '@/hooks/useToast';
import { SettingsProvider } from '@/hooks/useSettings';
import { GroupsProvider } from '@/hooks/useGroups';
import { SelectGroupModalProvider } from '@/hooks/useSelectGroupModal';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { EntitlementsProvider } from '@/lib/entitlements/EntitlementsProvider';

/** Same providers as Providers but without AppShell. Use for standalone pages (e.g. activate). */
export function ProvidersNoShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <EntitlementsProvider>
          <GroupsProvider>
            <SettingsProvider>
              <SelectGroupModalProvider>{children}</SelectGroupModalProvider>
            </SettingsProvider>
          </GroupsProvider>
        </EntitlementsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
