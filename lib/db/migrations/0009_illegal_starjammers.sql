DROP TABLE "Book";--> statement-breakpoint
DROP INDEX IF EXISTS "category_level_order_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "toc_item_entity_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "toc_item_order_idx";--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "role" varchar(20) DEFAULT 'regular' NOT NULL;

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TocItem" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entityType" varchar(50) NOT NULL,
	"entityId" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"anchorId" varchar(200) NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "toc_item_entity_idx" ON "TocItem" USING btree ("entityType","entityId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "toc_item_order_idx" ON "TocItem" USING btree ("entityType","entityId","order");