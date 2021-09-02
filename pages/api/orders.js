import moment from 'moment'

const NEOKEY = process.env.NEOKEY
const PATHWAY_DOMAIN = process.env.PATHWAY_DOMAIN

const _formatDate = (dayStr) => {
    if (dayStr === "Tuesday") return 4
    else if (dayStr === "Friday") return 3
    else return 4
}
export const _getTime = async () => {
    const today = moment().format('dddd')
    const searchDate = moment().subtract(_formatDate(today), 'days').format('YYYY-MM-DD')
    console.log(searchDate)
    return searchDate
}

export const _getData = async () => {
    let dateStr = await _getTime()
    const response = await fetch(`${PATHWAY_DOMAIN}/api/get_orders_that_match?api_key=${NEOKEY}&status=completed&date=${dateStr}`)
    const apidata = await response.json()
    return apidata
}

const handler = async (req, res) => {
    const today = moment().format('dddd')
    const searchDate = moment().subtract(_formatDate(today), 'days').format('YYYY-MM-DD')
    let apidata = await _getData()
    res.status(200).json({ day: searchDate, serverData: apidata })
}

export default handler