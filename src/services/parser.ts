import AsyncStorage from '@react-native-community/async-storage'
import * as rssParser from 'react-native-rss-parser'
import { convertToSortableTitle } from '../lib/utility'
import { PV } from '../resources'
import { combineWithAddByRSSPodcasts } from './podcast'

/*
addByRSSPodcasts: [addByRSSPodcast]
addByRSSPodcast: object {
  addByFeedUrl: string,
  episodes: [episode],
  ...other podcast properties
}
*/

export const getAddByRSSPodcast = async (feedUrl: string) => {
  const addByFeedUrlPodcasts = await getAddByRSSPodcasts()
  return addByFeedUrlPodcasts.find((x: any) => x.addByFeedUrl === feedUrl)
}

export const getAddByRSSPodcasts = async () => {
  try {
    const itemsString = await AsyncStorage.getItem(PV.Keys.ADD_BY_RSS_PODCASTS)
    return itemsString ? JSON.parse(itemsString) : []
  } catch (error) {
    console.log('getAddByRSSPodcasts', error)
    return []
  }
}

const setAddByRSSPodcasts = async (podcasts: any[]) => {
  if (Array.isArray(podcasts)) {
    await AsyncStorage.setItem(
      PV.Keys.ADD_BY_RSS_PODCASTS,
      JSON.stringify(podcasts)
    )
  }
}

export const parseAllAddByRSSPodcasts = async () => {
  const rssPodcasts = await getAddByRSSPodcasts()
  const parsedPodcasts = []
  for (const rssPodcast of rssPodcasts) {
    try {
      const parsedPodcast = await parseAddByRSSPodcast(rssPodcast.addByFeedUrl) as any
      if (parsedPodcast) {
        parsedPodcasts.push(parsedPodcast)
      }
    } catch (error) {
      console.log('parseAllAddByRSSPodcasts', error)
    }
  }

  for (const parsedPodcast of parsedPodcasts) {
    const index = rssPodcasts.findIndex((rssPodcast: any) => rssPodcast.addByFeedUrl === parsedPodcast.addByFeedUrl)
    if (index || index === 0) {
      rssPodcasts[index] = parsedPodcast
    } else {
      rssPodcasts.push(parsedPodcast)
    }
  }

  await setAddByRSSPodcasts(rssPodcasts)

  return rssPodcasts
}

export const parseAddByRSSPodcast = async (feedUrl: string) => {
  return fetch(feedUrl)
    .then((response) => response.text())
    .then((responseData) => rssParser.parse(responseData))
    .then(async (rss) => {
      const title = rss.title && rss.title.trim()
      if (!title) {
        throw new Error('parseAddByRSSPodcast: Title not defined')
      }
      const podcast = {} as any
      podcast.addByFeedUrl = feedUrl
      podcast.description = rss.description && rss.description.trim()
      podcast.feedLastUpdated = rss.lastUpdated || rss.lastPublished
      podcast.imageUrl = rss.image && rss.image.url
      podcast.isExplicit = rss.itunes && rss.itunes.explicit
      podcast.language = rss.language

      if (rss.items && rss.items.length > 0) {
        podcast.lastEpisodePubDate = rss.items[0].published
        podcast.lastEpisodeTitle = rss.items[0].title && rss.items[0].title.trim()
      }

      podcast.linkUrl = rss.links && rss.links[0] && rss.links[0].url
      podcast.sortableTitle = convertToSortableTitle(title)
      podcast.title = rss.title && rss.title.trim()
      podcast.type = rss.type

      const episodes = []
      if (rss.items && Array.isArray(rss.items)) {
        for (const item of rss.items) {
          const episode = {} as any
          const enclosure = item.enclosures && item.enclosures[0]
          if (!enclosure) continue
          episode.description = item.description && item.description.trim()
          episode.duration = item.itunes && item.itunes.duration
          episode.imageUrl = item.imageUrl
          episode.isExplicit = item.itunes && item.itunes.explicit
          episode.linkUrl = item.links && item.links[0] && item.links[0].url
          episode.mediaFilesize = enclosure.length
          episode.mediaType = enclosure.mimeType
          episode.mediaUrl = enclosure.url
          episode.pubDate = item.published
          episode.title = item.title && item.title.trim()
          episodes.push(episode)
        }
      }

      podcast.episodes = episodes

      await addParsedAddByRSSPodcast(podcast)
    })
}

const addParsedAddByRSSPodcast = async (parsedPodcast: any) => {
  const rssPodcasts = await getAddByRSSPodcasts()
  const index = rssPodcasts.findIndex((rssPodcast: any) => rssPodcast.addByFeedUrl === parsedPodcast.addByFeedUrl)
  if ((index && index >= 0) || index === 0) {
    rssPodcasts[index] = parsedPodcast
  } else {
    rssPodcasts.push(parsedPodcast)
  }
  await setAddByRSSPodcasts(rssPodcasts)
}

export const removeAddByRSSPodcast = async (feedUrl: string) => {
  let podcasts = await getAddByRSSPodcasts()
  podcasts = podcasts.filter((x: any) => x.addByFeedUrl !== feedUrl)
  await setAddByRSSPodcasts(podcasts)
  const combinedPodcasts = await combineWithAddByRSSPodcasts()
  return combinedPodcasts
}
