import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("weathers")
export class Weather {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  date!: string;

  @Column()
  state!: string;

  @Column()
  city!: string;

  @Column()
  temp!: number;

  @Column()
  feels!: number;

  @Column()
  condition!: string;

  @Column()
  icon!: string;

  @Column({ type: "simple-json" })
  forecast!: { time: string; temp: number; icon: string; }[];
}