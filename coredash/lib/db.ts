import "reflect-metadata";
import { DataSource, type DataSourceOptions } from "typeorm";

import { Todo } from "@/entities/Todo";
import { TodoRecurrence } from "@/entities/TodoRecurrence";
import { User } from "@/entities/User";
import { Weather } from "@/entities/Weather";
import { WeatherHour } from "@/entities/WeatherHour";
import { TodoCheck } from "@/entities/TodoCheck";
import { FlightCrawled } from "@/entities/FlightCrawled";
import { WishlistAmazon } from "@/entities/WishlistAmazon";
import { HabitTracker } from "@/entities/HabitTracker";
import { Notification } from "@/entities/Notification";
import { CONFIG, DB } from "@/config/config";

const entities = [
  Todo,
  TodoRecurrence,
  WishlistAmazon,
  TodoCheck,
  FlightCrawled,
  User,
  HabitTracker,
  Weather,
  WeatherHour,
  Notification,
];

const sqliteOptions: DataSourceOptions = {
  type: "sqlite",
  database: DB.sqlitePath,
  synchronize: DB.synchronize,
  logging: CONFIG.isDev,
};

const mariaDbOptions: DataSourceOptions = {
  type: "mariadb",
  host: DB.host,
  port: DB.port,
  database: DB.name,
  username: DB.username,
  password: DB.password,
  synchronize: false,
  logging: false,
};

export const AppDataSource = new DataSource({
  ...(DB.driver === "sqlite" ? sqliteOptions : mariaDbOptions),
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
      console.info(`Database initialized using ${DB.driver}`);
      return dataSource;
    })
    .catch((error: unknown) => {
      initializationPromise = null;
      console.error("Database initialization failed", error);
      throw error;
    });

  return initializationPromise;
}
