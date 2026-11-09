import "reflect-metadata";
import { DataSource, type DataSourceOptions } from "typeorm";

import { Todo } from "@/entities/Todo";
import { TodoRecurrence } from "@/entities/TodoRecurrence";
import { User } from "@/entities/User";
import { Weather } from "@/entities/Weather";
import { WeatherHour } from "@/entities/WeatherHour";
import { TodoCheck } from "@/entities/TodoCheck";
import { FlightCrawled } from "@/entities/FlightCrawled";
import { HabitTracker } from "@/entities/HabitTracker";
import { CONFIG, DB } from "@/config/config";
import { globalSingleton } from "@/lib/global-singleton";

const entities = [
  Todo,
  TodoRecurrence,
  TodoCheck,
  FlightCrawled,
  User,
  HabitTracker,
  Weather,
  WeatherHour,
];

const sqliteOptions: DataSourceOptions = {
  type: "better-sqlite3",
  database: DB.sqlitePath,
  synchronize: DB.synchronize,
  logging: CONFIG.isDev,
  prepareDatabase: (database: { pragma: (statement: string) => unknown }) => {
    // WAL keeps readers and the writer from blocking each other and, with
    // synchronous=NORMAL, avoids an fsync on every small write.
    database.pragma("journal_mode = WAL");
    database.pragma("synchronous = NORMAL");
  },
};

// Next.js bundles each route separately; without the registry every bundle
// would open its own connection to the same file.
const state = globalSingleton("database", () => ({
  dataSource: new DataSource({
    ...sqliteOptions,
    entities,
    subscribers: [],
    migrations: [],
  }),
  initializationPromise: null as Promise<DataSource> | null,
}));

export const AppDataSource = state.dataSource;

export async function getDatabaseConnection(): Promise<DataSource> {
  if (AppDataSource.isInitialized) return AppDataSource;
  if (state.initializationPromise) return state.initializationPromise;

  state.initializationPromise = AppDataSource.initialize()
    .then((dataSource) => {
      console.info(`Database initialized using sqlite (${DB.sqlitePath})`);
      return dataSource;
    })
    .catch((error: unknown) => {
      state.initializationPromise = null;
      console.error("Database initialization failed", error);
      throw error;
    });

  return state.initializationPromise;
}
