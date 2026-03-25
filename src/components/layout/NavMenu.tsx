'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSettings } from '@/hooks/useSettings';
import {
  IconHistory,
  IconLeaderboard,
  IconPayoutCalculator,
  IconSettings,
  IconSidePot,
  IconStats,
} from '@/components/ui/MenuIcons';

interface NavMenuProps {
  activePage?: 'payout' | 'sidepot' | 'history' | 'leaderboard' | 'stats';
  playerNames?: string[];
}

export function NavMenu({ activePage = 'payout', playerNames = [] }: NavMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { openSettingsModal } = useSettings();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const sidePotHref = playerNames.length > 0
    ? `/side-pot?names=${playerNames.join(',')}`
    : '/side-pot';

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        className="menu-btn"
        aria-label="Menu"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        <span />
        <span />
        <span />
      </button>
      {open && (
        <div className="menu-dropdown active">
          <Link href="/" onClick={() => setOpen(false)}>
            <IconPayoutCalculator className="menu-item-icon" />
            <span>Payout Calculator</span>
          </Link>
          <Link href={sidePotHref} onClick={() => setOpen(false)}>
            <IconSidePot className="menu-item-icon" />
            <span>Side Pot Calculator</span>
          </Link>
          <Link href="/history" onClick={() => setOpen(false)}>
            <IconHistory className="menu-item-icon" />
            <span>History</span>
          </Link>
          <Link href="/leaderboard" onClick={() => setOpen(false)}>
            <IconLeaderboard className="menu-item-icon" />
            <span>Leaderboard</span>
          </Link>
          <Link href="/stats" onClick={() => setOpen(false)}>
            <IconStats className="menu-item-icon" />
            <span>Stats</span>
          </Link>
          <button
            className="menu-link"
            onClick={(e) => {
              e.preventDefault();
              setOpen(false);
              openSettingsModal();
            }}
          >
            <IconSettings className="menu-item-icon" />
            <span>Settings</span>
          </button>
        </div>
      )}
    </div>
  );
}
