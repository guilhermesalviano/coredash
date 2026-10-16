import { Entity, Column, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Todo } from "./Todo";

@Entity("todo_checks")
export class TodoCheck {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @PrimaryColumn({ type: "varchar" })
  timestamp!: string;

  @Column({ type: "varchar" })
  hour!: string;

  @Column({ type: "tinyint", width: 1, default: 0 })
  checked!: number;

  @ManyToOne(() => Todo)
  @JoinColumn()
  todo!: Todo;
}