import { memo } from 'react';
import clsx from 'clsx';
import { css } from '@linaria/core';

import { rowClassname, rowSelectedClassname } from './style';
import { SELECT_COLUMN_KEY } from './Columns';
import GroupCell from './GroupCell';
import type { CalculatedColumn, GroupRow, Omit } from './types';
import { RowSelectionProvider } from './hooks';
import { getRowStyle } from './utils';

export const cellFrozenLast = css`
  @layer rdg.Cell {
    box-shadow: calc(2px * var(--rdg-sign)) 0 5px -2px rgba(136, 136, 136, 0.3);
  }
`;
export const cell = css`
  @layer rdg.Cell {
    /* max-content does not work with size containment
     * dynamically switching between different containment styles incurs a heavy relayout penalty
     * Chromium bug: at odd zoom levels or subpixel positioning, layout/paint containment can make cell borders disappear
     *   https://bugs.chromium.org/p/chromium/issues/detail?id=1326946
     */
    contain: style;
    position: relative; /* needed for absolute positioning to work */
    padding-block: 0;
    padding-inline: 8px;
    border-inline-end: 1px solid var(--rdg-border-color);
    border-block-end: 1px solid var(--rdg-border-color);
    grid-row-start: var(--rdg-grid-row-start);
    background-color: inherit;

    white-space: nowrap;
    overflow: hidden;
    overflow: clip;
    text-overflow: ellipsis;
    outline: none;

    &[aria-selected='true'] {
      outline: 2px solid var(--rdg-selection-color);
      outline-offset: -2px;
    }
  }
`;

export interface GroupRowRendererProps<R, SR>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style' | 'children'> {
  id: string;
  groupKey: unknown;
  viewportColumns: readonly CalculatedColumn<R, SR>[];
  childRows: readonly R[];
  rowIdx: number;
  row: GroupRow<R>;
  gridRowStart: number;
  height: number;
  level: number;
  selectedCellIdx: number | undefined;
  isExpanded: boolean;
  isRowSelected: boolean;
  selectGroup: (rowIdx: number) => void;
  toggleGroup: (expandedGroupId: unknown) => void;
}

const groupRow = css`
  @layer rdg.GroupedRow {
    &:not([aria-selected='true']) {
      background-color: var(--rdg-header-background-color);
    }

    > .${cell}:not(:last-child):not(.${cellFrozenLast}) {
      border-inline-end: none;
    }
  }
`;

const groupRowClassname = `rdg-group-row ${groupRow}`;

function GroupedRow<R, SR>({
  id,
  groupKey,
  viewportColumns,
  childRows,
  rowIdx,
  row,
  gridRowStart,
  height,
  level,
  isExpanded,
  selectedCellIdx,
  isRowSelected,
  selectGroup,
  toggleGroup,
  ...props
}: GroupRowRendererProps<R, SR>) {
  // Select is always the first column
  const idx = viewportColumns[0].key === SELECT_COLUMN_KEY ? level + 1 : level;

  function handleSelectGroup() {
    selectGroup(rowIdx);
  }

  return (
    <RowSelectionProvider value={isRowSelected}>
      <div
        role="row"
        aria-level={level}
        aria-expanded={isExpanded}
        className={clsx(
          rowClassname,
          groupRowClassname,
          `rdg-row-${rowIdx % 2 === 0 ? 'even' : 'odd'}`,
          {
            [rowSelectedClassname]: selectedCellIdx === -1
          }
        )}
        onClick={handleSelectGroup}
        style={getRowStyle(gridRowStart, height)}
        {...props}
      >
        {viewportColumns.map((column) => (
          <GroupCell
            key={column.key}
            id={id}
            groupKey={groupKey}
            childRows={childRows}
            isExpanded={isExpanded}
            isCellSelected={selectedCellIdx === column.idx}
            column={column}
            row={row}
            groupColumnIndex={idx}
            toggleGroup={toggleGroup}
          />
        ))}
      </div>
    </RowSelectionProvider>
  );
}

export default memo(GroupedRow) as <R, SR>(props: GroupRowRendererProps<R, SR>) => JSX.Element;
