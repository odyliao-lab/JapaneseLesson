import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
