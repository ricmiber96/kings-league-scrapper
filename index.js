import * as cheerio from 'cheerio'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

const URLS = {
  leaderboard: 'https://kingsleague.pro/estadisticas/clasificacion/'
}

async function scrape (url) {
  const res = await fetch(url)
  const html = await res.text()
  return cheerio.load(html)
}

const normalizeText = (text) => {
  return text
    .replace(/\s\s+/g, ' ')
    .replace(/.*:/g, ' ')
    .trim()
}

async function getLeaderboard () {
  const $ = await scrape(URLS.leaderboard)
  const $rows = $('table tbody tr')
  const leaderboard = []
  const LEADERBOARD_SELECTORS = {
    team: { selector: '.fs-table-text_3', typeOf: 'string' },
    iconImg: { selector: '.fs-table-text_2', typeOf: 'string' },
    wins: { selector: '.fs-table-text_4', typeOf: 'number' },
    loses: { selector: '.fs-table-text_5', typeOf: 'number' },
    scoredGoals: { selector: '.fs-table-text_6', typeOf: 'number' },
    concededGoals: { selector: '.fs-table-text_7', typeOf: 'number' },
    yellowCards: { selector: '.fs-table-text_8', typeOf: 'number' },
    redCards: { selector: '.fs-table-text_9', typeOf: 'number' }

  }
  const leaderBoardSelectorEntries = Object.entries(LEADERBOARD_SELECTORS)
  $rows.each((i, element) => {
    const leaderBoardEntries = leaderBoardSelectorEntries.map(([key, { selector, typeOf }]) => {
      const rawValue = $(element).find(selector).text()
      const normalText = normalizeText(rawValue)
      const value = typeOf === 'number' ? Number(normalText) : normalText
      return [key, value]
    })
    leaderboard.push(Object.fromEntries(leaderBoardEntries))
  })
  return leaderboard
}

const leaderboard = await getLeaderboard()
const filePath = path.join(process.cwd(), './db/leaderboard.json')
await writeFile(filePath, JSON.stringify(leaderboard, null, 2), 'utf-8')
