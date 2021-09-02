import nodemailer from 'nodemailer'
import moment from 'moment'
import _ from 'lodash';
import converter from 'json-2-csv'
import { _getData } from './orders'


var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: `${process.env.EMAIL}`,
        pass: `${process.env.EMAIL_PASS}`
    }
});
function sendReport(file) {
    transporter.sendMail(
        {
            from: process.env.EMAIL,
            to: [`${process.env.SEND_EMAIL}`],
            subject: `CBTS Pathway Orders Report ${moment().format("YYYY-MM-DD")}`,
            html: `<p>Transactions-${moment().format("MM-DD-YY")}</p>`,
            attachments: [
                {
                    filename: `transactions-${moment().format("MM-DD-YY")}.csv`,
                    content: file,
                },
            ],
        },
        function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log(`Email sent: CBTS Pathway Orders Report ${moment().format("YYYY-MM-DD")}` + info.response);
            }
        }
    );
}


const handler = async (req, res) => {
    if (req.method === 'GET') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ name: `Thanks` }))
    } else if (req.method === 'POST' && req.body.pass === process.env.TEMP_POST_PASS) {
        let dataRes = await _getItems(_formatData(await _getData()))
        _convertData(await dataRes)

        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ name: dataRes }))
        return
    }

}

const _formatTime = (dateString) => {
    return moment(`${dateString}`).format('MM-DD-YYYY')
}

const _formatData = (data) => {
    let arr = data.map(x => {
        let name = (x.user_name.split(" ").length == 2) ? x.user_name.split(" ") : x.user_name;
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
            'ID': x.id,
            'Pmt Gateway': x.processor,
            "Order Number": x.order_number,
            "Date": _formatTime(x.checkout_at),
            "Student's Name": x.new_name,
            "User ID": x.user_id,
            "Currency": x.currency,
            "Item Total": item.unit_cost,
            "Item ID": item.item_id,
            "Class Code": item.item_name.split(" ")[0]
        }, item))
    })
    let newArr = _.flattenDeep(result)
    let arr = newArr.filter(x => (!x["Class Code"].includes("audit") && !x["Class Code"].includes("Audit")) && x["Item Total"] > 70)
    return _deleteUnused(arr)
}

const _deleteUnused = (arr) => {
    return arr.map(obj => {
        return _.pick(obj, 'ID', 'Pmt Gateway', 'Order Number', 'Date', 'Student\'s Name', "User ID", "Currency", "Item Total", "Item ID", "Class Code")
    })

}

const _convertData = async (data) => {
    converter.json2csv(data, (err, csv) => {
        if (err) {
            throw err;
        }
        // send CSV 
        sendReport(csv)
    });
}

export default handler