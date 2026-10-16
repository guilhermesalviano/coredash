import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("todo_recurrences")
export class TodoRecurrence {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "tinyint", width: 1, default: 0 })
  repeat!: number;

  @Column({ type: "int", default: 1 })
  weeklyInterval!: number;

  @Column("simple-array", { nullable: true })
  weeklyDays!: string | null;

  @Column({ type: "varchar", nullable: true })
  weeklyEnd!: string | null;
}