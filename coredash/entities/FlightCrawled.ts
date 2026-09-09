import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("flight_crawled")
@Index(["searchDate"])
export class FlightCrawled {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn({ nullable: true })
  searchDate!: Date;

  @Column()
  airline!: string;

  @Column()
  stops!: number;

  @Column()
  origin!: string;

  @Column()
  destination!: string;

  @Column()
  price!: string;

  @Column()
  flightDate!: string;
}
