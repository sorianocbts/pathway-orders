import React, { useState } from 'react'
import _ from 'lodash';
import moment from 'moment'
import axios from 'axios'
import { testdata } from '../data/testdata'
import Paper from '@material-ui/core/Paper';
import {
    SearchState,
    SelectionState,
    IntegratedFiltering,
    IntegratedSelection,
    IntegratedSorting,
    SortingState,
    PagingState,
    IntegratedPaging,

} from '@devexpress/dx-react-grid';
import { GridExporter } from '@devexpress/dx-react-grid-export';
import {
    Grid,
    Table,
    Toolbar,
    SearchPanel,

    TableColumnResizing,
    TableColumnVisibility,
    PagingPanel,
    TableHeaderRow,
    TableSelection,
    ExportPanel
} from '@devexpress/dx-react-grid-material-ui';
import saveAs from 'file-saver';


// REST
const server = `${process.env.CURRENT_DOMAIN}:${process.env.PORT}`



export async function getServerSideProps(context) {
    const res = await axios(`${server}/api/orders`)
    const serverSide = await res.data
    if (!serverSide) {
        return {
            notFound: true,
        }
    }
    return {
        props: {
            serverSide,
        },
    }
}


const Orders = ({ serverSide }) => {
    const [apidata, setApiData] = useState(testdata)
    React.useEffect(() => {
        console.log("here")
        serverSide ? setApiData(serverSide.serverData) : testdata
    }, [serverSide])

    // Export CSV
    const exporterRef = React.useRef();
    const startExport = (options) => {
        exporterRef.current.exportGrid(options);
    };
    const onSave = (workbook) => {
        workbook.xlsx.writeBuffer().then((buffer) => {
            saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `transactions-${moment().format("MM-DD-YY")}.xlsx`);
        });
    };
    //END export CSV

    //Data formatting
    const formattedData = _formatData(apidata)
    let data = formattedData.filter(x => x.user_name !== "Visitor Account" && (x.order_number !== null && x.checkout_at !== null)).reverse()
    const [columns] = useState([
        { name: 'id', title: 'ID' },
        { name: 'processor', title: 'Pmt Gateway' },
        { name: 'order_number', title: 'Order Number' },
        { name: 'timestamp', title: 'Date' },
        { name: 'new_name', title: 'Student\'s Name' },
        { name: 'user_id', title: 'User ID' },
        { name: 'currency', title: 'Currency' },
        { name: 'total', title: 'Item Total' },
        { name: 'item_type', title: 'Item Type' },
        { name: 'item_id', title: 'Item ID' },
        { name: 'new_item_name', title: 'Class Code' },

    ]);
    const [defaultHiddenColumnNames] = useState(["id"]);
    const [defaultColumnWidths] = useState([
        { columnName: 'id', width: 180 },
        { columnName: 'processor', width: 90 },
        { columnName: 'order_number', width: 250 },
        { columnName: 'timestamp', width: 120 },
        { columnName: 'new_name', width: 180 },
        { columnName: 'user_id', width: 120 },
        { columnName: 'currency', width: 100 },
        { columnName: 'total', width: 120 },
        { columnName: 'item_type', width: 90 },
        { columnName: 'item_id', width: 120 },
        { columnName: 'new_item_name', width: 120 },

    ]);




    const [selection, setSelection] = useState([]);
    const [pageSizes] = useState([25, 50, 75, 0]);

    let rows = _getItems(data)
    return (
        <div>
            <h1>Orders</h1>
            <Paper>
                <Grid rows={rows} columns={columns}>

                    <SelectionState
                        selection={selection}
                        onSelectionChange={setSelection}
                    />
                    <PagingState
                        defaultCurrentPage={0}
                        defaultPageSize={25}
                    />
                    <SearchState defaultValue="" />
                    <IntegratedFiltering />
                    <SortingState
                        defaultSorting={[{ columnName: 'timestamp', direction: 'desc' }, { columnName: 'id', direction: 'desc' }]}
                    />
                    <IntegratedSorting />
                    <IntegratedPaging />
                    <Table />
                    <TableColumnResizing defaultColumnWidths={defaultColumnWidths} />
                    <IntegratedSelection />
                    <TableHeaderRow showSortingControls />

                    <TableSelection
                        selectByRowClick
                        showSelectAll
                    />
                    <TableColumnVisibility
                        defaultHiddenColumnNames={defaultHiddenColumnNames}
                    />

                    <Toolbar />
                    <ExportPanel startExport={startExport} />
                    <SearchPanel />
                    <PagingPanel
                        pageSizes={pageSizes}
                    />
                </Grid>
                <GridExporter
                    ref={exporterRef}
                    columns={columns}
                    rows={rows}
                    selection={selection}
                    onSave={onSave}
                />
            </Paper>
        </div>
    )
}

export default Orders
const _formatTime = (dateString) => {
    return moment(`${dateString}`).format('MM-DD-YYYY')
}

const _formatData = (data) => {
    let arr = data.map(x => {
        let name = (x.user_name.split(" ").length == 2) ? x.user_name.split(" ") : x.user_name;
        // let courseName =
        let newObj = Object.assign({
            new_name: `${name[1]} ${name[0]}`,
            processor: "Stripe"

        }, x)
        return newObj

    })
    return arr
}
const _getItems = (transactions) => {

    let result = transactions.map(x => {
        return x.items.map(item => Object.assign({
            id: x.id,
            order_number: x.order_number,
            timestamp: _formatTime(x.checkout_at),
            new_name: x.new_name,
            user_id: x.user_id,
            currency: x.currency,
            total: item.unit_cost,
            new_item_name: item.item_name.split(" ")[0],
            processor: x.processor
        }, item))
    })
    let newArr = _.flattenDeep(result)
    let arr = newArr.filter(x => (!x.item_name.includes("audit") && !x.item_name.includes("Audit")) && x.total > 70)
    return arr
}
