-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Roles table
CREATE TABLE "roles" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "roles_name_key" ON "roles" ("name");

-- Users table
CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "display_name" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deleted_at" TIMESTAMPTZ
);

CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");

-- User roles junction table
CREATE TABLE "user_roles" (
  "user_id" UUID NOT NULL,
  "role_id" INTEGER NOT NULL,
  "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "pk_user_roles" PRIMARY KEY ("user_id", "role_id"),
  CONSTRAINT "fk_user_roles_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_user_roles_role_id" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "idx_user_roles_role_id" ON "user_roles" ("role_id");

-- Documents table
CREATE TABLE "documents" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "slug" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "owner_id" UUID NOT NULL,
  "summary" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "published_at" TIMESTAMPTZ,
  CONSTRAINT "fk_documents_owner_id" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "idx_documents_slug" ON "documents" ("slug");
CREATE INDEX "idx_documents_owner_id" ON "documents" ("owner_id");

-- Document versions table
CREATE TABLE "document_versions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_id" UUID NOT NULL,
  "version_number" INTEGER NOT NULL DEFAULT 1,
  "content" JSONB NOT NULL,
  "summary" TEXT,
  "created_by_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_document_versions_document_id" FOREIGN KEY ("document_id") REFERENCES "documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_document_versions_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "idx_document_versions_unique_version" ON "document_versions" ("document_id", "version_number");
CREATE INDEX "idx_document_versions_created_by_id" ON "document_versions" ("created_by_id");

-- Audit logs table
CREATE TABLE "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "action" TEXT NOT NULL,
  "actor_id" UUID,
  "document_id" UUID,
  "document_version_id" UUID,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_audit_logs_actor_id" FOREIGN KEY ("actor_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "fk_audit_logs_document_id" FOREIGN KEY ("document_id") REFERENCES "documents" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "fk_audit_logs_document_version_id" FOREIGN KEY ("document_version_id") REFERENCES "document_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "idx_audit_logs_actor_id" ON "audit_logs" ("actor_id");
CREATE INDEX "idx_audit_logs_document_id" ON "audit_logs" ("document_id");
CREATE INDEX "idx_audit_logs_document_version_id" ON "audit_logs" ("document_version_id");

-- Analytics events table
CREATE TABLE "analytics_events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_type" TEXT NOT NULL,
  "user_id" UUID,
  "document_id" UUID,
  "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "properties" JSONB,
  CONSTRAINT "fk_analytics_events_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "fk_analytics_events_document_id" FOREIGN KEY ("document_id") REFERENCES "documents" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "idx_analytics_events_user_id" ON "analytics_events" ("user_id");
CREATE INDEX "idx_analytics_events_document_id" ON "analytics_events" ("document_id");
CREATE INDEX "idx_analytics_events_occurred_at" ON "analytics_events" ("occurred_at");
