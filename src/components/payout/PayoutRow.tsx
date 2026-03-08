'use client';

import { parseNum, fmtOptionalDecimals } from '@/lib/calc/formatting';

interface PayoutRowProps {
  name: string;
  buyIn: string;
  cashOut: string;
  settled: boolean;
  payout: number;
  deleteMode: boolean;
  checkboxesVisible: boolean;
  tableLocked: boolean;
  onUpdateName: (v: string) => void;
  onUpdateBuyIn: (v: string) => void;
  onUpdateCashOut: (v: string) => void;
  onUpdateSettled: (v: boolean) => void;
  onAdjust: (delta: number) => void;
  onDelete: () => void;
}

export function PayoutRow({
  name,
  buyIn,
  cashOut,
  settled,
  payout,
  deleteMode,
  checkboxesVisible,
  tableLocked,
  onUpdateName,
  onUpdateBuyIn,
  onUpdateCashOut,
  onUpdateSettled,
  onAdjust,
  onDelete,
}: PayoutRowProps) {
  const inVal = parseNum(buyIn);
  const outVal = parseNum(cashOut);
  const payoutStr = fmtOptionalDecimals(payout);

  return (
    <tr className={tableLocked ? 'row-locked' : ''}>
      <td>
        <div
          className={`name-cell-wrapper${
            deleteMode ? '' : ' hidden-delete-btns'
          }${!checkboxesVisible ? ' hidden-checkboxes' : ''}`}
        >
          <input
            type="checkbox"
            checked={settled}
            title="Settled"
            onChange={(e) => onUpdateSettled(e.target.checked)}
          />
          <input
            className="input-field name-input"
            type="text"
            placeholder="Player"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            value={name}
            disabled={tableLocked}
            onChange={(e) => onUpdateName(e.target.value)}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            type="button"
            className={`delete-btn${tableLocked ? ' locked' : ''}`}
            aria-label="Delete player"
            disabled={tableLocked}
            onClick={onDelete}
          >
            🗑
          </button>
        </div>
      </td>
      <td className="step-cell minus-cell">
        <button
          type="button"
          className="step-btn minus"
          title="Subtract buy-in"
          aria-label="Subtract buy-in"
          disabled={tableLocked}
          onClick={() => onAdjust(-1)}
        >
          −
        </button>
      </td>
      <td>
        <input
          className={`input-field num-input${inVal === 0 ? ' zero-value' : ''}`}
          type="text"
          placeholder="0"
          inputMode="numeric"
          autoComplete="off"
          value={buyIn}
          disabled={tableLocked}
          onChange={(e) => onUpdateBuyIn(e.target.value)}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
      </td>
      <td className="step-cell plus-cell">
        <button
          type="button"
          className="step-btn plus"
          title="Add buy-in"
          aria-label="Add buy-in"
          disabled={tableLocked}
          onClick={() => onAdjust(1)}
        >
          +
        </button>
      </td>
      <td>
        <input
          className={`input-field num-input${outVal === 0 ? ' zero-value' : ''}`}
          type="text"
          placeholder="0.00"
          inputMode="decimal"
          autoComplete="off"
          value={cashOut}
          disabled={tableLocked}
          onChange={(e) => onUpdateCashOut(e.target.value)}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
      </td>
      <td className="payout">{payoutStr}</td>
    </tr>
  );
}
