import React from 'react';
import { TableContainer, Table, TableHead, TableBody, TableRow, TableSortLabel, TableCell } from '@material-ui/core';
import { Size, Padding } from '@material-ui/core/Table';

type Order = 'asc' | 'desc';

interface Column {
    id : string;
    content : any;
    align? : 'inherit' | 'left' | 'center' | 'right' | 'justify';
    bodyCellPadding? : Padding;
    headCellPadding? : Padding;
    firstOrder? : Order;
    descendingComparator? : (aRowIndex: number, bRowIndex : number, columnIndex : number) => number;
}

interface DataTableProps {
    columns : Array<Column>;
    rows : Array<Array<any>>;
    className? : string;
    size? : Size;
    padding? : Padding;
    defaultOrderBy? : number;
    rowKey? : (rowIndex : number) => string;
    rowSelected? : (rowIndex : number) => boolean;
    onRowMouseDown? : (rowIndex : number, event : React.MouseEvent<HTMLTableRowElement, MouseEvent>) => void;
    onRowClick? : (rowIndex : number, event : React.MouseEvent<HTMLTableRowElement, MouseEvent>) => void;
    onRowDoubleMouseDown? : (rowIndex : number, event : React.MouseEvent<HTMLTableRowElement, MouseEvent>) => void;
    onRowDoubleClick? : (rowIndex : number, event : React.MouseEvent<HTMLTableRowElement, MouseEvent>) => void;
}

interface DataTableState {
    orderBy? : number;
    order? : Order;
}

export class DataTable extends React.Component<DataTableProps, DataTableState> {
    private static readonly DOUBLE_MOUSE_DOWN_THRESHOLD = 400;

    private originalToSortedIndex : Map<number, number>;
    private sortedToOriginalIndex : Map<number, number>;
    private lastMouseDownTimestamp : number;
    private lastMouseDownRowIndex : number;

    constructor(props : DataTableProps) {
        super(props);
        this.originalToSortedIndex = null;
        this.sortedToOriginalIndex = null;
        this.lastMouseDownTimestamp = 0;
        this.lastMouseDownRowIndex = -1;

        this.state = {
            orderBy: this.props.defaultOrderBy,
            order: (this.props.defaultOrderBy == null) ? null : (this.props.columns[this.props.defaultOrderBy].firstOrder || 'asc')
        }
    }

    static genericDescendingComparator(a : any, b : any) : number {
        if (a > b || (a != null && b == null)) {
            return -1;
        }

        if (a < b || (a == null && b != null)) {
            return 1;
        }

        return 0;
    }

    private defaultDescendingComparator(aRowIndex : number, bRowIndex : number, columnIndex : number) : number {
        return DataTable.genericDescendingComparator(this.props.rows[aRowIndex][columnIndex], this.props.rows[bRowIndex][columnIndex]);
    }

    private getComparator(order : Order, columnIndex : number) : (aRowIndex : number, bRowIndex : number) => number {
        if (columnIndex == null) {
            return null;
        }

        let descendingComparator : (aRowIndex : number, bRowIndex : number, columnIndex : number) => number;
        
        if (this.props.columns[columnIndex].descendingComparator != null) {
            descendingComparator = (aRowIndex, bRowIndex, columnIndex) => this.props.columns[columnIndex].descendingComparator(aRowIndex, bRowIndex, columnIndex);
        }
        else {
            descendingComparator = (aRowIndex, bRowIndex, columnIndex) => this.defaultDescendingComparator(aRowIndex, bRowIndex, columnIndex);
        }

        if (order == 'desc') {
            return (aRowIndex, bRowIndex) => descendingComparator(aRowIndex, bRowIndex, columnIndex);
        }
        
        return (aRowIndex, bRowIndex) => -descendingComparator(aRowIndex, bRowIndex, columnIndex);
    }

    private stableSort(array : Array<any>, comparator: (aRowIndex : number, bRowIndex : number) => number) : Array<[any, number]> {
        const stabilizedArray = array.map((x, index) => [x, index] as [any, number]);

        if (comparator != null) {
            stabilizedArray.sort((a, b) => {
                const order = comparator(a[1], b[1]);
                
                if (order != 0) {
                    return order;
                }

                return a[1] - b[1];
            });
        }

        this.originalToSortedIndex = new Map();
        this.sortedToOriginalIndex = new Map();

        for (let i = 0; i < stabilizedArray.length; ++i) {
            this.originalToSortedIndex.set(stabilizedArray[i][1], i);
            this.sortedToOriginalIndex.set(i, stabilizedArray[i][1]);
        }

        return stabilizedArray;
    }

    getSortedRowIndex(originalRowIndex : number) : number {
        return this.originalToSortedIndex.get(originalRowIndex);
    }

    getOriginalRowIndex(sortedRowIndex : number) : number {
        return this.sortedToOriginalIndex.get(sortedRowIndex);
    }

    private onTableSortLabelClick(columnIndex : number) {
        let firstOrder : Order = this.props.columns[columnIndex].firstOrder || 'asc';
        let secondOrder : Order = (firstOrder == 'asc') ? 'desc' : 'asc';
        
        const newState : DataTableState = {
            orderBy: columnIndex,
            order: firstOrder
        };

        if (this.state.orderBy == columnIndex) {
            if (this.state.order == firstOrder) {
                newState.order = secondOrder;
            }
            else {
                newState.orderBy = null;
                newState.order = null;
            }
        }

        this.setState(newState);
    }

    private onRowMouseDown(rowIndex : number, event : React.MouseEvent<HTMLTableRowElement, MouseEvent>) {
        if (this.props.onRowMouseDown) {
            this.props.onRowMouseDown(rowIndex, event);
        }

        const now = Date.now();

        if (this.props.onRowDoubleMouseDown && this.lastMouseDownRowIndex == rowIndex && now - this.lastMouseDownTimestamp < DataTable.DOUBLE_MOUSE_DOWN_THRESHOLD) {
            this.props.onRowDoubleMouseDown(rowIndex, event);
            this.lastMouseDownRowIndex = -1;
        }

        this.lastMouseDownTimestamp = now;
        this.lastMouseDownRowIndex = rowIndex;
    }

    render() {
        return (
            <TableContainer className={this.props.className}>
                <Table size={this.props.size} padding={this.props.padding}>
                    <TableHead>
                        <TableRow>
                            {this.props.columns.map((column, columnIndex) => (
                                <TableCell
                                    key={column.id}
                                    align={column.align}
                                    padding={column.headCellPadding}
                                    sortDirection={(this.state.orderBy == columnIndex) ? this.state.order : false}
                                >
                                    <TableSortLabel
                                        active={this.state.orderBy == columnIndex}
                                        direction={(this.state.orderBy == columnIndex) ? this.state.order : (this.props.columns[columnIndex].firstOrder || 'asc')}
                                        onClick={() => this.onTableSortLabelClick(columnIndex)}
                                    >
                                        {column.content}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {this.stableSort(this.props.rows, this.getComparator(this.state.order, this.state.orderBy)).map(([row, originalIndex]) => (
                        <TableRow
                            key={(this.props.rowKey) ? this.props.rowKey(originalIndex) : null}
                            selected={(this.props.rowSelected) ? this.props.rowSelected(originalIndex) : false}
                            hover
                            onMouseDown={e => this.onRowMouseDown(originalIndex, e)}
                            onClick={e => this.props.onRowClick && this.props.onRowClick(originalIndex, e)}
                            onDoubleClick={e => this.props.onRowDoubleClick && this.props.onRowDoubleClick(originalIndex, e)}
                        >
                            {this.props.columns.map((column, columnIndex) => (
                                <TableCell padding={column.bodyCellPadding}>{row[columnIndex]}</TableCell>
                            ))}
                        </TableRow>))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }
}