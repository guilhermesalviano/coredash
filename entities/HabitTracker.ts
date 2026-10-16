import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity("habit_tracker")
@Index(["habit", "createdAt"])
export class HabitTracker {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  createdAt!: Date;

  @Column()
  habit!: string;

  @Column({ type: "varchar", nullable: true })
  maxStreak!: string | null;
}
