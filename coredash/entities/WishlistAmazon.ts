import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("wishlist_amazon")
@Index(["title", "searchDate"])
export class WishlistAmazon {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  price!: string;

  @Column()
  link!: string;

  @CreateDateColumn({ name: "search_date", nullable: true })
  searchDate!: Date;
}
