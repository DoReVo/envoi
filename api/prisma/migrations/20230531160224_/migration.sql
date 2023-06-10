-- CreateTable
CREATE TABLE "routes" (
    "id" UUID NOT NULL,
    "path" TEXT NOT NULL,
    "targets" JSONB NOT NULL,
    "tags" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "route_id" UUID NOT NULL,
    "method" TEXT NOT NULL,
    "header" JSONB NOT NULL,
    "body" JSONB NOT NULL,
    "query_string" JSONB NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "composite_primary_key" PRIMARY KEY ("id","route_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "routes_path_key" ON "routes"("path");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
