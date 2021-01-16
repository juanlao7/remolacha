import React from 'react';
import { TableContainer, Table, TableHead, TableBody, TableRow, TableSortLabel, TableCell } from '@material-ui/core';
import { Size, Padding } from '@material-ui/core/Table';

type Order = 'asc' | 'desc';

interface Column {
    id : string;
    content : any;
    align? : 'inherit' | 'left' | 'center' | 'right' | 'justify'
    bodyCellPadding? : Padding;
    headCellPadding? : Padding;
}

interface DataTableProps {
    columns : Array<Column>;
    rows : Array<Array<any>>;
    className? : string;
    size? : Size;
    padding? : Padding;
    rowKey? : (rowIndex : number) => string
    rowSelected? : (rowIndex : number) => boolean
    onRowClick? : (rowIndex : number) => void
}

interface DataTableState {
    orderBy? : number;
    order? : Order;
}

export class DataTable extends React.Component<DataTableProps, DataTableState> {
    constructor(props : DataTableProps) {
        super(props);

        this.state = {
            orderBy: null,
            order: null
        }
    }

    private descendingComparator<T>(a : T, b : T, orderBy : keyof T) {
        if (b[orderBy] < a[orderBy]) {
            return -1;
        }

        if (b[orderBy] > a[orderBy]) {
            return 1;
        }

        return 0;
    }

    private getComparator<Key extends keyof any>(order : Order, orderBy : Key) : (a: {[key in Key] : number | string}, b : {[key in Key] : number | string}) => number {
        return (order == 'desc') ? (a, b) => this.descendingComparator(a, b, orderBy) : (a, b) => -this.descendingComparator(a, b, orderBy);
    }

    private stableSort(array : Array<any>, comparator: (a : any, b : any) => number) : Array<[any, number]> {
        const stabilizedThis = array.map((x, index) => [x, index] as [any, number]);

        stabilizedThis.sort((a, b) => {
            const order = comparator(a[0], b[0]);
            
            if (order != 0) {
                return order;
            }

            return a[1] - b[1];
        });

        return stabilizedThis;
    }

    private onTableSortLabelClick(columnIndex : number) {
        const newState : DataTableState = {
            orderBy: columnIndex,
            order: 'asc'
        };

        if (this.state.orderBy == columnIndex) {
            if (this.state.order == 'asc') {
                newState.order = 'desc';
            }
            else {
                newState.orderBy = null;
                newState.order = null;
            }
        }

        this.setState(newState);
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
                                        direction={(this.state.orderBy == columnIndex) ? this.state.order : 'asc'}
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
                            onClick={() => this.props.onRowClick && this.props.onRowClick(originalIndex)}
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