import { GoogleCalendarEvent } from "./calendar";

export interface StockResult {
  symbol: string;
  shortName: string;
  longName: string;
  currency: string;
  regularMarketPrice: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketDayRange: string;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketTime: string;
  marketCap: number | null;
  regularMarketVolume: number;
  regularMarketPreviousClose: number;
  regularMarketOpen: number;
  fiftyTwoWeekRange: string;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
  priceEarnings: number | null;
  earningsPerShare: number | null;
  logourl: string;
}

export interface ErrorResponse {
  error: string;
}

export interface BrapiResponse {
  results: StockResult[];
  requestedAt: string;
  took: number;
}

export type CalendarEventsResponse = GoogleCalendarEvent[];


export interface SerpApiGoogleNewsResponse {
  search_metadata: SearchMetadata;
  search_parameters: SearchParameters;
  top_stories_link: TopStoriesLink;
  news_results: NewsResult[];
  menu_links: MenuLink[];
}

interface SearchMetadata {
  id: string;
  status: string;
  json_endpoint: string;
  created_at: string;
  processed_at: string;
  google_news_url: string;
  raw_html_file: string;
  total_time_taken: number;
}

interface SearchParameters {
  engine: string;
  gl: string;
  hl: string;
}

interface TopStoriesLink {
  topic_token: string;
  serpapi_link: string;
}

interface NewsResultHighlight {
  title?: string;
  source?: string;
  link?: string;
}

export interface NewsResult {
  position: number;
  title: string;
  highlight?: NewsResultHighlight;
  stories?: string;
  source: string;
  link?: string;
  thumbnail?: string;
  snippet?: string;
  thumbnail_small?: string;
  story_token: string;
  serpapi_link: string;
  date: string;
  iso_date?: string;
}

interface MenuLink {
  title: string;
  topic_token: string;
  serpapi_link: string;
}

interface NewsPagination {
  limit: number;
  offset: number;
  count: number;
  total: number;
}

interface NewsArticle {
  author: string | null;
  title: string;
  description: string;
  url: string;
  source: string;
  image: string | null;
  category: string;
  language: string;
  country: string;
  published_at: string; // ISO 8601
}

export interface NewsResponse {
  pagination: NewsPagination;
  data: NewsArticle[];
}

interface Address {
  suburb:          string;
  city:            string;
  municipality:    string;
  state_district:  string;
  state:           string;
  "ISO3166-2-lvl4": string;
  region:          string;
  postcode:        string;
  country:         string;
  country_code:    string;
}

export interface LocationResponse {
  place_id:     number;
  licence:      string;
  osm_type:     string;
  osm_id:       number;
  lat:          string; // Note: vem como string na API
  lon:          string;
  category:     string;
  type:         string;
  place_rank:   number;
  importance:   number;
  addresstype:  string;
  name:         string;
  display_name: string;
  address:      Address;
  boundingbox:  string[];
}

export interface NominatimProps {
  latitude: string;
  longitude: string;
}

interface CurrentUnits {
  time:                 string;
  interval:             string;
  temperature_2m:       string;
  relative_humidity_2m: string;
  apparent_temperature: string;
  weather_code:         number;
}

interface CurrentWeather {
  time:                 string;
  interval:             number;
  temperature_2m:       number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  weather_code:         number;
}

interface HourlyUnits {
  time:           string;
  temperature_2m: string;
  weather_code:   number;
}

interface HourlyWeather {
  time:           string[];
  temperature_2m: number[];
  weather_code:   number[];
  is_day:         number[];
  precipitation_probability: number[];
}

export interface OpenMeteoProps {
  latitude: string;
  longitude: string;
  limit: number;
  timezone?: string;
}

export interface WeatherResponse {
  latitude:              number;
  longitude:             number;
  generationtime_ms:     number;
  utc_offset_seconds:    number;
  timezone:              string;
  timezone_abbreviation: string;
  elevation:             number;
  current_units:         CurrentUnits;
  current:               CurrentWeather;
  hourly_units:          HourlyUnits;
  hourly:                HourlyWeather;
}
