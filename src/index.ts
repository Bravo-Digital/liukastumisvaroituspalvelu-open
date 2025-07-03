import { XMLParser } from "fast-xml-parser"
import Parser from "rss-parser"

import { eq } from "drizzle-orm"
import { db } from "@/db/index"
import { warningsTable, warningDetailsTable } from "@/db/schema"

interface Area {
  areaDesc: string
}

interface InfoBlock {
  language: string
  severity: string
  certainty: string
  event: string
  onset: string
  expires: string
  headline: string
  description: string
  area: Area | Area[]
}

interface Info {
  lang: string
  severity: string
  certainty: string
  event: string
  onset: string
  expires: string
  headline: string
  description: string
  areaDesc: string[]
}

const FEED_URL = 'https://alerts.fmi.fi/cap/feed/rss_en-GB.rss'
let modified: string | null = null

const areasToCheck = [
  "Uusimaa",
]
async function checkWarnings() {
  try {
    const headResponse = await fetch(FEED_URL, { method: 'HEAD' })
    const lastModified = headResponse.headers.get('last-modified')
    if (modified === lastModified) {
      return
    }
    modified = lastModified

    const parser = new Parser()
    const feed = await parser.parseURL(FEED_URL)

    const warnings = []

    for (const item of feed.items) {
      const isWind = true
      const isRoughlyHelsinki = /helsinki|uusimaa|southern|whole/i.test(String(item.title))

      if (isWind && isRoughlyHelsinki && item.link) {
        const capResponse = await fetch(item.link)
        const capText = await capResponse.text()

        const xmlParser = new XMLParser({ ignoreAttributes: false })
        const cap = xmlParser.parse(capText)
        const alert = cap.alert
        const identifier = alert.identifier

        const infoList = Array.isArray(alert.info) ? alert.info : [alert.info]

        const info: Info[] = infoList.map((infoBlock: InfoBlock): Info => {
          const areaDescs: string[] = Array.isArray(infoBlock.area)
            ? infoBlock.area.map((a: Area) => a.areaDesc)
            : [infoBlock.area?.areaDesc].filter(Boolean) as string[]

          return {
            lang: infoBlock.language,
            severity: infoBlock.severity,
            certainty: infoBlock.certainty,
            event: infoBlock.event,
            onset: infoBlock.onset,
            expires: infoBlock.expires,
            headline: infoBlock.headline,
            description: infoBlock.description,
            areaDesc: areaDescs,
          }
        })

        const matchesTargetArea = info.some(block =>
          block.areaDesc.some(desc =>
            areasToCheck.some(target =>
              desc.toLowerCase().includes(target.toLowerCase())
            )
          )
        )

        if (!matchesTargetArea) {
          continue
        }
        warnings.push({
          identifier,
          info
        })
      }
    }
    
    if (warnings.length > 0) {
      for (const warning of warnings) {
        const existing = await db
          .select()
          .from(warningsTable)
          .where(eq(warningsTable.id, warning.identifier))

        if (existing.length === 0) {
          await db
            .insert(warningsTable)
            .values({
              id: warning.identifier,
              severity: warning.info[0].severity,
              certainty: warning.info[0].certainty,
              createdAt: new Date(),
              onsetAt: new Date(warning.info[0].onset),
              expiresAt: new Date(warning.info[0].expires),
            })

          for (const detail of warning.info) {
            await db.insert(warningDetailsTable).values({
              warningId: warning.identifier,
              lang: detail.lang,
              location: detail.areaDesc,
              headline: detail.headline,
              description: detail.description,
              event: detail.event,
            })
          }
        }
      }
    } else {
      return
    }
  } catch (error) {
    console.error('Error fetching feed:', error)
    return
  }
}

async function startPolling() {
  await checkWarnings()

  setInterval(async () => {
    await checkWarnings()
  }, 60 * 1000)
}

startPolling()
