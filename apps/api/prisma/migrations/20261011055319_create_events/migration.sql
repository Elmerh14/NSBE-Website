-- CreateTable
CREATE TABLE "events" (
    "title" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3),
    "location" TEXT NOT NULL,
    "rsvp_link" TEXT,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_starts_at_idx" ON "events"("starts_at");
