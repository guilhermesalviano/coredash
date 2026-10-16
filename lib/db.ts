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
  type: "sqlite",
  database: DB.sqlitePath,
  synchronize: DB.synchronize,
  logging: CONFIG.isDev,
};

export const AppDataSource = new DataSource({
  ...sqliteOptions,
  entities,
  subscribers: [],
  migrations: [],
});

let initializationPromise: Promise<DataSource> | null = null;

export async function getDatabaseConnection(): Promise<DataSource> {
  if (AppDataSource.isInitialized) return AppDataSource;
  if (initializationPromise) return initializationPromise;

  initializationPromise = AppDataSource.initialize()
    .then((dataSource) => {
      console.info(`Database initialized using sqlite (${DB.sqlitePath})`);
      return dataSource;
    })
    .catch((error: unknown) => {
      initializationPromise = null;
      console.error("Database initialization failed", error);
      throw error;
    });

  return initializationPromise;
}
