import Parser from 'rss-parser';
import { XMLParser } from 'fast-xml-parser';

const RSS_FEED_URL = 'https://alerts.fmi.fi/cap/feed/rss_fi-FI.rss';

interface Warning {
  title: string;
  link: string;
  published: string;
  info: {
    lang: string;
    event: string;
    effective: string;
    expires: string;
    headline?: string;
    description: string;
    areaDesc: string;
  }[];
}

let lastModified: string | null = null;

export async function checkForWindWarningsInHelsinki(): Promise<Warning[]> {
  try {
    const headResp = await fetch(RSS_FEED_URL, { method: 'HEAD' });
    const currentLastModified = headResp.headers.get('last-modified');

    if (lastModified && currentLastModified === lastModified) {
      console.log('No new warnings.');
      return [];
    }

    lastModified = currentLastModified;

    
    const parser = new Parser();
    const feed = await parser.parseURL(RSS_FEED_URL);

    const windWarnings: Warning[] = [];

    for (const item of feed.items) {
      const content = `${item.title} ${item.contentSnippet}`;
      const isWind = /tuuli|vind|wind/i.test(content);
      const isHelsinki = /helsinki|uusimaa|etelä-suomi/i.test(content);

      if (isWind && isHelsinki && item.link) {
        const capResp = await fetch(item.link);
        const capText = await capResp.text();

        const xmlParser = new XMLParser({ ignoreAttributes: false });
        const cap = xmlParser.parse(capText);
        const alert = cap.alert;

        const infoList = Array.isArray(alert.info) ? alert.info : [alert.info];

        const info = infoList.map((infoBlock) => ({
          lang: infoBlock['@_lang'],
          event: infoBlock.event,
          effective: infoBlock.effective,
          expires: infoBlock.expires,
          headline: infoBlock.headline || '',
          description: infoBlock.description,
          areaDesc: infoBlock.area.areaDesc,
        }));

        windWarnings.push({
          title: item.title ?? '',
          link: item.link,
          published: item.pubDate ?? '',
          info,
        });
      }
    }

    return windWarnings;
  } catch (error) {
    console.error('Error checking warnings:', error);
    return [];
  }
}
