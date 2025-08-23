CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"phone" varchar(20) NOT NULL,
	"area" varchar(128) NOT NULL,
	"join_date" timestamp DEFAULT now() NOT NULL,
	"hour" varchar(5) NOT NULL
);
