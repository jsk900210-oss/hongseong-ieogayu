import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    authProvider: text("auth_provider").notNull().default("sites"),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    memberType: text("member_type").notNull().default("general"),
    cohortCode: text("cohort_code").notNull().default(""),
    stayPeriod: text("stay_period").notNull().default(""),
    stayArea: text("stay_area").notNull().default(""),
    interests: text("interests").notNull().default(""),
    profileVisibility: text("profile_visibility").notNull().default("mates"),
    onboardingCompletedAt: integer("onboarding_completed_at", { mode: "timestamp" }),
    activityScore: integer("activity_score").notNull().default(30),
    lastActiveAt: integer("last_active_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [uniqueIndex("idx_users_email").on(table.email)],
);

export const joins = sqliteTable(
  "joins",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    keyword: text("keyword").notNull().default("기타"),
    location: text("location").notNull(),
    scheduledAt: integer("scheduled_at", { mode: "timestamp" }).notNull(),
    maxParticipants: integer("max_participants").notNull(),
    status: text("status").notNull().default("모집중"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [uniqueIndex("idx_joins_owner_title").on(table.ownerId, table.title)],
);

export const joinParticipants = sqliteTable(
  "join_participants",
  {
    joinId: integer("join_id")
      .notNull()
      .references(() => joins.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("신청"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("idx_join_participants_join_user").on(
      table.joinId,
      table.userId,
    ),
  ],
);

export const places = sqliteTable(
  "places",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    emoji: text("emoji").notNull(),
    address: text("address").notNull().default(""),
    phone: text("phone").notNull().default(""),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    source: text("source").notNull().default("operator"),
    sourceId: text("source_id").notNull().default(""),
    publicStatus: text("public_status").notNull().default("unknown"),
    verificationStatus: text("verification_status").notNull().default("needs_check"),
    lastSourceCheckedAt: integer("last_source_checked_at", { mode: "timestamp" }),
    lastCommunityCheckedAt: integer("last_community_checked_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("idx_places_source_id").on(table.source, table.sourceId),
  ],
);

export const placeReviews = sqliteTable("place_reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  placeId: text("place_id").notNull().references(() => places.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  body: text("body").notNull(),
  visitedAt: integer("visited_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const placeReports = sqliteTable("place_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  placeId: text("place_id").notNull().references(() => places.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reportType: text("report_type").notNull(),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
});

export const placeVerificationRuns = sqliteTable("place_verification_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  placeId: text("place_id").notNull().references(() => places.id, { onDelete: "cascade" }),
  source: text("source").notNull(),
  result: text("result").notNull(),
  evidence: text("evidence").notNull().default(""),
  checkedAt: integer("checked_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const festivalSchedules = sqliteTable("festival_schedules", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  season: text("season").notNull().default(""),
  location: text("location").notNull().default(""),
  description: text("description").notNull().default(""),
  startDate: text("start_date"),
  endDate: text("end_date"),
  scheduleStatus: text("schedule_status").notNull().default("unconfirmed"),
  verificationStatus: text("verification_status").notNull().default("pending"),
  sourceName: text("source_name").notNull().default(""),
  sourceUrl: text("source_url").notNull().default(""),
  contactPhone: text("contact_phone").notNull().default(""),
  lastCheckedAt: integer("last_checked_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const festivalVerificationRuns = sqliteTable("festival_verification_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  festivalId: text("festival_id").notNull().references(() => festivalSchedules.id, { onDelete: "cascade" }),
  sourceName: text("source_name").notNull(),
  sourceUrl: text("source_url").notNull(),
  observedStartDate: text("observed_start_date"),
  observedEndDate: text("observed_end_date"),
  observedStatus: text("observed_status").notNull().default("found"),
  evidence: text("evidence").notNull().default(""),
  checkedAt: integer("checked_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

