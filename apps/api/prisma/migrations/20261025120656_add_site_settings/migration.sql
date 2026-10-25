-- CreateTable
CREATE TABLE "site_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "contact_email" TEXT,
    "join_url" TEXT,
    "instagram_url" TEXT,
    "linkedin_url" TEXT,
    "tiktok_url" TEXT,
    "facebook_url" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);


-- Added by hand (Prisma's schema can't express CHECK constraints):
-- the table is a singleton, so only the row with id 1 may exist.
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_singleton" CHECK ("id" = 1);
