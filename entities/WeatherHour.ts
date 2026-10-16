import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity("weather_hours")
export class WeatherHour {
  @PrimaryColumn({unique: true})
  timestamp!: string;

  @Column()
  time!: string;

  @Column()
  temp!: number;

  @Column()
  icon!: string;
}