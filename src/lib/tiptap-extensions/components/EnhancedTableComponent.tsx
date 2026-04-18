'use client';

import React, { useState, useRef, useCallback } from 'react';
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { 
  Plus, 
  Minus, 
  ChevronUp, 
  ChevronDown, 
  Settings, 
  Trash2,
  GripVertical,
  Palette
} from 'lucide-react';

const EnhancedTableComponent = ({ node, editor, updateAttributes }: NodeViewProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [showControls, setShowControls] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const handleAddRow = useCallback((position: 'before' | 'after' = 'after') => {
    const { state } = editor;
    const { selection } = state;
    const { $from } = selection;
    
    const tablePos = $from.start();
    const table = state.doc.nodeAt(tablePos);
    if (!table) return;

    const rowCount = table.content.childCount;
    const colCount = table.content.child(0)?.content.childCount || 2;

    const newRow = state.schema.nodes.tableRow.create(
      {},
      Array.from({ length: colCount }, () => 
        state.schema.nodes.tableCell.create({}, [
          state.schema.nodes.paragraph.create()
        ])
      )
    );

    const tr = state.tr;
    const insertPos = position === 'after' ? $from.end() : $from.start();
    tr.insert(insertPos, newRow);
    
    editor.view.dispatch(tr);
  }, [editor]);

  const handleAddColumn = useCallback((position: 'before' | 'after' = 'after') => {
    const { state } = editor;
    const { selection } = state;
    const { $from } = selection;
    
    const tablePos = $from.start();
    const table = state.doc.nodeAt(tablePos);
    if (!table) return;

    const tr = state.tr;
    table.content.forEach((row: any) => {
      const newCell = state.schema.nodes.tableCell.create({}, [
        state.schema.nodes.paragraph.create()
      ]);
      const insertPos = position === 'after' ? row.pos + row.nodeSize - 1 : row.pos + 1;
      tr.insert(insertPos, newCell);
    });
    
    editor.view.dispatch(tr);
  }, [editor]);

  const handleDeleteRow = useCallback(() => {
    const { state } = editor;
    const { selection } = state;
    const { $from } = selection;
    
    const tablePos = $from.start();
    const table = state.doc.nodeAt(tablePos);
    const rowPos = $from.start();
    const row = state.doc.nodeAt(rowPos);
    
    if (!table || !row) return;
    if (table.content.childCount <= 1) return; // Don't delete last row

    const tr = state.tr;
    tr.delete(rowPos, rowPos + row.nodeSize);
    editor.view.dispatch(tr);
  }, [editor]);

  const handleDeleteColumn = useCallback(() => {
    const { state } = editor;
    const { selection } = state;
    const { $from } = selection;
    
    const tablePos = $from.start();
    const table = state.doc.nodeAt(tablePos);
    const cellPos = $from.start();
    const cell = state.doc.nodeAt(cellPos);
    
    if (!table || !cell) return;
    
    const firstRow = table.content.child(0);
    if (firstRow.content.childCount <= 1) return; // Don't delete last column

    const rowPos = $from.start();
    const row = state.doc.nodeAt(rowPos);
    
    // Find column index by iterating through row content
    let colIndex = -1;
    if (row) {
      row.content.forEach((rowCell: any, index: number) => {
        if (rowCell === cell) {
          colIndex = index;
        }
      });
    }

    if (colIndex === -1) return;

    const tr = state.tr;
    table.content.forEach((tableRow: any) => {
      const targetCell = tableRow.content.child(colIndex);
      if (targetCell) {
        tr.delete(targetCell.pos, targetCell.pos + targetCell.nodeSize);
      }
    });
    
    editor.view.dispatch(tr);
  }, [editor]);

  const handleSort = useCallback((columnIndex: number, direction: 'asc' | 'desc') => {
    const { state } = editor;
    const { selection } = state;
    const { $from } = selection;
    
    const tablePos = $from.start();
    const table = state.doc.nodeAt(tablePos);
    if (!table) return;

    const tr = state.tr;
    const rows = table.content.content || [];
    const headerRow = rows[0];
    const dataRows = rows.slice(1);

    if (dataRows.length === 0) return;

    // Sort data rows based on the specified column
    const sortedRows = dataRows.sort((a: any, b: any) => {
      const cellA = a.content.child(columnIndex);
      const cellB = b.content.child(columnIndex);
      
      const textA = cellA?.content?.child(0)?.text || '';
      const textB = cellB?.content?.child(0)?.text || '';
      
      const comparison = textA.localeCompare(textB);
      return direction === 'asc' ? comparison : -comparison;
    });

    // Rebuild table with sorted rows
    const newContent = [headerRow, ...sortedRows];
    
    const newTable = state.schema.nodes.enhancedTable.create(
      { ...table.attrs, sortState: { column: columnIndex, direction } },
      newContent
    );

    const startPos = tablePos;
    const endPos = tablePos + table.nodeSize;
    
    tr.replaceWith(startPos, endPos, newTable);
    
    // Update sort state
    const sortState = { column: columnIndex, direction };
    tr.setNodeMarkup(startPos, null, {
      ...table.attrs,
      sortState,
    });

    editor.view.dispatch(tr);
    return true;
  }, [editor]);

  const handleColumnResize = useCallback((columnIndex: number, newWidth: number) => {
    const currentWidths = node.attrs.columnWidths || [];
    const newWidths = [...currentWidths];
    newWidths[columnIndex] = newWidth;
    
    updateAttributes({ columnWidths: newWidths });
  }, [node.attrs.columnWidths, updateAttributes]);

  const handleCellAlignment = useCallback((rowIndex: number, columnIndex: number, alignment: 'left' | 'center' | 'right') => {
    const { state } = editor;
    const { selection } = state;
    const { $from } = selection;
    
    const tablePos = $from.start(-1);
    const table = state.doc.nodeAt(tablePos);
    if (!table) return;
    
    let cellPos = tablePos + 1;
    for (let i = 0; i <= rowIndex; i++) {
      const row = table.content.child(i);
      if (i === rowIndex) {
        for (let j = 0; j <= columnIndex; j++) {
          const cell = row.content.child(j);
          if (j === columnIndex && cell) {
            const tr = state.tr;
            tr.setNodeMarkup(cellPos, null, {
              ...cell.attrs,
              alignment,
            });
            editor.view.dispatch(tr);
            return;
          }
          cellPos += cell.nodeSize;
        }
      } else {
        cellPos += row.nodeSize;
      }
    }
  }, [editor]);

  const handleCellBackground = useCallback((rowIndex: number, columnIndex: number, color: string) => {
    const { state } = editor;
    const { selection } = state;
    const { $from } = selection;
    
    const tablePos = $from.start(-1);
    const table = state.doc.nodeAt(tablePos);
    if (!table) return;
    
    let cellPos = tablePos + 1;
    for (let i = 0; i <= rowIndex; i++) {
      const row = table.content.child(i);
      if (i === rowIndex) {
        for (let j = 0; j <= columnIndex; j++) {
          const cell = row.content.child(j);
          if (j === columnIndex && cell) {
            const tr = state.tr;
            tr.setNodeMarkup(cellPos, null, {
              ...cell.attrs,
              backgroundColor: color,
            });
            editor.view.dispatch(tr);
            return;
          }
          cellPos += cell.nodeSize;
        }
      } else {
        cellPos += row.nodeSize;
      }
    }
  }, [editor]);

  return (
    <NodeViewWrapper className="enhanced-table-wrapper">
      <div 
        ref={tableRef}
        className="enhanced-table-container"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Table Controls */}
        {showControls && (
          <div className="enhanced-table-controls">
            <div className="table-actions">
              <div className="action-group">
                <span className="action-label">Rows:</span>
                <button
                  onClick={() => handleAddRow('before')}
                  className="action-btn"
                  title="Add row before"
                >
                  <Plus size={14} />
                  <ChevronUp size={10} />
                </button>
                <button
                  onClick={() => handleAddRow('after')}
                  className="action-btn"
                  title="Add row after"
                >
                  <Plus size={14} />
                  <ChevronDown size={10} />
                </button>
                <button
                  onClick={handleDeleteRow}
                  className="action-btn danger"
                  title="Delete row"
                >
                  <Minus size={14} />
                </button>
              </div>

              <div className="action-group">
                <span className="action-label">Columns:</span>
                <button
                  onClick={() => handleAddColumn('before')}
                  className="action-btn"
                  title="Add column before"
                >
                  <Plus size={14} />
                  <ChevronUp size={10} />
                </button>
                <button
                  onClick={() => handleAddColumn('after')}
                  className="action-btn"
                  title="Add column after"
                >
                  <Plus size={14} />
                  <ChevronDown size={10} />
                </button>
                <button
                  onClick={handleDeleteColumn}
                  className="action-btn danger"
                  title="Delete column"
                >
                  <Minus size={14} />
                </button>
              </div>

              <div className="action-group">
                <span className="action-label">Table:</span>
                <button
                  className="action-btn"
                  title="Table settings"
                >
                  <Settings size={14} />
                </button>
                <button
                  className="action-btn danger"
                  title="Delete table"
                  onClick={() => {
                    const { state } = editor;
                    const { selection } = state;
                    const { $from } = selection;
                    const tablePos = $from.start(-1);
                    const table = state.doc.nodeAt(tablePos);
                    
                    if (table) {
                      const tr = state.tr;
                      tr.delete(tablePos, tablePos + table.nodeSize);
                      editor.view.dispatch(tr);
                    }
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="enhanced-table-content">
          <NodeViewContent className="enhanced-table" />
        </div>

        {/* Column Headers for Sorting */}
        {node.attrs.sortable && (
          <div className="table-sort-headers">
            {Array.from({ length: node.content?.child(0)?.content.childCount || 0 }).map((_, index) => (
              <div 
                key={index}
                className={`sort-header ${selectedColumn === index ? 'selected' : ''}`}
                onClick={() => setSelectedColumn(index)}
              >
                <span>Column {index + 1}</span>
                <div className="sort-controls">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSort(index, 'asc');
                    }}
                    className={`sort-btn ${node.attrs.sortState?.column === index && node.attrs.sortState?.direction === 'asc' ? 'active' : ''}`}
                    title="Sort ascending"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSort(index, 'desc');
                    }}
                    className={`sort-btn ${node.attrs.sortState?.column === index && node.attrs.sortState?.direction === 'desc' ? 'active' : ''}`}
                    title="Sort descending"
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export default EnhancedTableComponent;
