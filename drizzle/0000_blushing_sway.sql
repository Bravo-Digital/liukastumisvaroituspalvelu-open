CREATE TABLE "feedback" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "feedback_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(256),
	"email" varchar(256),
	"category" varchar(50) NOT NULL,
	"subject" varchar(512) NOT NULL,
	"message" text NOT NULL,
	"contact_back" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warning_details" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "warning_details_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"warning_id" varchar(256) NOT NULL,
	"lang" varchar(5) NOT NULL,
	"location" varchar(256)[] NOT NULL,
	"headline" varchar(512),
	"description" text NOT NULL,
	"event" varchar(128) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warnings" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"severity" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"certainty" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"effective_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL
);
