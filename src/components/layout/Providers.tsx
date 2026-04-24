'use client';

import { ToastProvider } from '@/hooks/useToast';
import { SettingsProvider } from '@/hooks/useSettings';
import { GroupsProvider } from '@/hooks/useGroups';
import { SelectGroupModalProvider } from '@/hooks/useSelectGroupModal';
import { AppShell } from './AppShell';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { EntitlementsProvider } from '@/lib/entitlements/EntitlementsProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <EntitlementsProvider>
        <GroupsProvider>
          <SettingsProvider>
            <SelectGroupModalProvider>
              <AppShell>{children}</AppShell>
            </SelectGroupModalProvider>
          </SettingsProvider>
        </GroupsProvider>
        </EntitlementsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
