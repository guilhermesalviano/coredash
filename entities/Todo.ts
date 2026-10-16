import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToOne } from "typeorm";
import { TodoRecurrence } from "./TodoRecurrence";

@Entity("todos")
export class Todo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "varchar", length: 32, default: "reminder" })
  type!: "reminder" | "task";

  @Column({ type: "varchar", length: 32, default: "todo" })
  status!: "backlog" | "todo" | "in_progress" | "done";

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "int", default: 0 })
  order!: number;

  @Column({ type: "varchar", nullable: true })
  priority!: string | null;

  @Column({ type: "datetime" })
  createdAt!: Date;

  @Column({ type: "datetime", nullable: true })
  completedAt!: Date | null;

  @Column({ type: "varchar", nullable: true })
  sponsor!: string | null;

  @OneToOne(() => TodoRecurrence, { cascade: true, nullable: true })
  @JoinColumn()
  recurrence!: TodoRecurrence | null;
}