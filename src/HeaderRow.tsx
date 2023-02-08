import { memo } from 'react';
import clsx from 'clsx';
import { css } from '@linaria/core';

import HeaderCell from './HeaderCell';
import type { CalculatedColumn, Direction } from './types';
import { getColSpan, getRowStyle } from './utils';
import type { DataGridProps } from './DataGrid';
import { cellFrozen, rowSelectedClassname } from './style';
const cell = css`
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

type SharedDataGridProps<R, SR, K extends React.Key> = Pick<
  DataGridProps<R, SR, K>,
  'sortColumns' | 'onSortColumnsChange'
>;

export interface HeaderRowProps<R, SR, K extends React.Key> extends SharedDataGridProps<R, SR, K> {
  columns: readonly CalculatedColumn<R, SR>[];
  onColumnResize: (column: CalculatedColumn<R, SR>, width: number | 'max-content') => void;
  selectCell: (columnIdx: number) => void;
  lastFrozenColumnIndex: number;
  selectedCellIdx: number | undefined;
  shouldFocusGrid: boolean;
  direction: Direction;
}

const headerRow = css`
  @layer rdg.HeaderRow {
    display: contents;
    line-height: var(--rdg-header-row-height);
    background-color: var(--rdg-header-background-color);
    font-weight: bold;

    & > .${cell} {
      /* Should have a higher value than 0 to show up above regular cells */
      z-index: 1;
      position: sticky;
      inset-block-start: 0;
    }

    & > .${cellFrozen} {
      z-index: 2;
    }
  }
`;

const headerRowClassname = `rdg-header-row ${headerRow}`;

function HeaderRow<R, SR, K extends React.Key>({
  columns,
  onColumnResize,
  sortColumns,
  onSortColumnsChange,
  lastFrozenColumnIndex,
  selectedCellIdx,
  selectCell,
  shouldFocusGrid,
  direction
}: HeaderRowProps<R, SR, K>) {
  const cells = [];
  for (let index = 0; index < columns.length; index++) {
    const column = columns[index];
    const colSpan = getColSpan(column, lastFrozenColumnIndex, { type: 'HEADER' });
    if (colSpan !== undefined) {
      index += colSpan - 1;
    }

    cells.push(
      <HeaderCell<R, SR>
        key={column.key}
        column={column}
        colSpan={colSpan}
        isCellSelected={selectedCellIdx === column.idx}
        onColumnResize={onColumnResize}
        onSortColumnsChange={onSortColumnsChange}
        sortColumns={sortColumns}
        selectCell={selectCell}
        shouldFocusGrid={shouldFocusGrid && index === 0}
        direction={direction}
      />
    );
  }

  return (
    <div
      role="row"
      aria-rowindex={1} // aria-rowindex is 1 based
      className={clsx(headerRowClassname, {
        [rowSelectedClassname]: selectedCellIdx === -1
      })}
      style={getRowStyle(1)}
    >
      {cells}
    </div>
  );
}

export default memo(HeaderRow) as <R, SR, K extends React.Key>(
  props: HeaderRowProps<R, SR, K>
) => JSX.Element;
