import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  email: text("email").primaryKey(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["student", "teacher", "parent"] }).notNull().default("student"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const progress = sqliteTable(
  "progress",
  {
    email: text("email").notNull(),
    day: integer("day").notNull(),
    score: integer("score").notNull().default(0),
    minutes: integer("minutes").notNull().default(0),
    completedAt: text("completed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.email, table.day] })],
);

export const classes = sqliteTable("classes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  teacherEmail: text("teacher_email").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const classMembers = sqliteTable(
  "class_members",
  {
    classId: integer("class_id").notNull(),
    studentEmail: text("student_email").notNull(),
    displayName: text("display_name").notNull(),
    joinedAt: text("joined_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.classId, table.studentEmail] })],
);

export const assignments = sqliteTable("assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  classId: integer("class_id").notNull(),
  title: text("title").notNull(),
  startDay: integer("start_day").notNull(),
  endDay: integer("end_day").notNull(),
  dueDate: text("due_date").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const lessonAttempts = sqliteTable("lesson_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  day: integer("day").notNull(),
  score: integer("score").notNull(),
  minutes: integer("minutes").notNull(),
  note: text("note").notNull().default(""),
  answersJson: text("answers_json").notNull().default("{}"),
  completedAt: text("completed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const submissions = sqliteTable("submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assignmentId: integer("assignment_id").notNull(),
  studentEmail: text("student_email").notNull(),
  content: text("content").notNull().default(""),
  score: integer("score"),
  feedback: text("feedback").notNull().default(""),
  status: text("status", { enum: ["submitted", "reviewed", "returned"] }).notNull().default("submitted"),
  submittedAt: text("submitted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  reviewedAt: text("reviewed_at"),
});

export const familyInvites = sqliteTable("family_invites", {
  code: text("code").primaryKey(),
  studentEmail: text("student_email").notNull(),
  expiresAt: text("expires_at").notNull(),
  redeemedBy: text("redeemed_by"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const guardianLinks = sqliteTable(
  "guardian_links",
  {
    guardianEmail: text("guardian_email").notNull(),
    studentEmail: text("student_email").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.guardianEmail, table.studentEmail] })],
);

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const lessonOverrides = sqliteTable("lesson_overrides", {
  day: integer("day").primaryKey(),
  title: text("title").notNull(),
  payloadJson: text("payload_json").notNull().default("{}"),
  updatedBy: text("updated_by").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const kanaMastery = sqliteTable(
  "kana_mastery",
  {
    email: text("email").notNull(),
    kana: text("kana").notNull(),
    day: integer("day").notNull(),
    rating: text("rating", { enum: ["smooth", "review", "retry"] }).notNull().default("review"),
    attempts: integer("attempts").notNull().default(1),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.email, table.kana] }),
    index("kana_mastery_email_day_idx").on(table.email, table.day),
  ],
);

export const localUsers = sqliteTable("local_users", {
  email: text("email").primaryKey(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const localSessions = sqliteTable("local_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  email: text("email").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("local_sessions_email_idx").on(table.email)]);
