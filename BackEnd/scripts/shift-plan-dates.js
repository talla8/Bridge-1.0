#!/usr/bin/env node

const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'data', 'bridge.sqlite');

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;

    const key = token.slice(2);
    const value = argv[index + 1];
    args[key] = value;
    index += 1;
  }

  return args;
}

function usage() {
  console.error(
    [
      'Usage:',
      'node scripts/shift-plan-dates.js --teacher <teacherId> --subject <subjectId> --target <YYYY-MM-DD|ISO>',
      '',
      'Example:',
      'node scripts/shift-plan-dates.js --teacher demo_teacher_6 --subject 1 --target 2026-03-30',
    ].join('\n'),
  );
}

function openDatabase(filename) {
  return new sqlite3.Database(filename);
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve(this);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row ?? null);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows ?? []);
    });
  });
}

function close(db) {
  return new Promise((resolve, reject) => {
    db.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function buildPlanIdWithTimestamp(planId, nextTimestamp) {
  const parts = String(planId).split('_');
  const rawTimestamp = Number(parts[parts.length - 1]);

  if (!Number.isNaN(rawTimestamp) && rawTimestamp > 0) {
    parts[parts.length - 1] = String(nextTimestamp);
    return parts.join('_');
  }

  return `${planId}_${nextTimestamp}`;
}

function parseTargetDate(rawTarget, currentStartDate) {
  if (!rawTarget) {
    throw new Error('--target is required');
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(rawTarget);
  if (dateOnlyMatch) {
    const current = new Date(currentStartDate);
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);

    return new Date(
      year,
      month,
      day,
      current.getHours(),
      current.getMinutes(),
      current.getSeconds(),
      current.getMilliseconds(),
    );
  }

  const parsed = new Date(rawTarget);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Unable to parse target date: ${rawTarget}`);
  }

  return parsed;
}

function shiftDate(value, deltaMs) {
  return new Date(new Date(value).getTime() + deltaMs);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const teacherId = args.teacher;
  const subjectId = args.subject;
  const rawTarget = args.target;

  if (!teacherId || !subjectId || !rawTarget) {
    usage();
    process.exitCode = 1;
    return;
  }

  const db = openDatabase(dbPath);

  try {
    const plan = await get(
      db,
      `
        SELECT plan_id, teacher_id, subject_id, start_date, sessions_json, plan_json
        FROM plans
        WHERE teacher_id = ? AND subject_id = ?
        ORDER BY start_date DESC
        LIMIT 1
      `,
      [teacherId, String(subjectId)],
    );

    if (!plan) {
      throw new Error(
        `No plan found for teacher ${teacherId} and subject ${subjectId}.`,
      );
    }

    const currentStartDate = new Date(plan.start_date);
    const targetDate = parseTargetDate(rawTarget, currentStartDate);
    const deltaMs = targetDate.getTime() - currentStartDate.getTime();
    const nextPlanId = buildPlanIdWithTimestamp(plan.plan_id, targetDate.getTime());

    const sessions = JSON.parse(plan.sessions_json);
    const updatedSessions = sessions.map((session) => ({
      ...session,
      planId: nextPlanId,
      sessionDate: shiftDate(session.sessionDate, deltaMs).toISOString(),
      items: (session.items ?? []).map((item) => ({
        ...item,
        planId: nextPlanId,
      })),
    }));

    const updatedPlanJson = JSON.parse(plan.plan_json).map((sessionSummary) => ({
      ...sessionSummary,
      sessionDate: shiftDate(sessionSummary.sessionDate, deltaMs).toISOString(),
    }));

    const sessionRows = await all(
      db,
      `SELECT session_id, session_date, items_json FROM sessions WHERE teacher_id = ? AND subject_id = ?`,
      [teacherId, String(subjectId)],
    );

    const sessionRowMap = new Map(
      sessionRows.map((session) => [String(session.session_id), session]),
    );

    const planLogs = await all(
      db,
      `SELECT plan_log_id, created_at FROM plan_logs WHERE plan_id = ?`,
      [plan.plan_id],
    );

    await run(db, 'BEGIN TRANSACTION');

    await run(
      db,
      `
        UPDATE plans
        SET plan_id = ?,
            start_date = ?,
            sessions_json = ?,
            plan_json = ?
        WHERE plan_id = ?
      `,
      [
        nextPlanId,
        targetDate.toISOString(),
        JSON.stringify(updatedSessions),
        JSON.stringify(updatedPlanJson),
        plan.plan_id,
      ],
    );

    await run(
      db,
      `UPDATE plan_items SET plan_id = ? WHERE plan_id = ?`,
      [nextPlanId, plan.plan_id],
    );

    for (const session of updatedSessions) {
      const sourceSession = sessionRowMap.get(String(session.sessionId));
      const sourceItems = sourceSession ? JSON.parse(sourceSession.items_json) : [];
      const shiftedItems = sourceItems.map((item) => ({
        ...item,
        planId: nextPlanId,
      }));

      await run(
        db,
        `
          UPDATE sessions
          SET session_date = ?,
              items_json = ?
          WHERE session_id = ?
        `,
        [
          session.sessionDate,
          JSON.stringify(shiftedItems),
          session.sessionId,
        ],
      );
    }

    await run(
      db,
      `UPDATE plan_logs SET plan_id = ? WHERE plan_id = ?`,
      [nextPlanId, plan.plan_id],
    );

    for (const log of planLogs) {
      await run(
        db,
        `UPDATE plan_logs SET created_at = ? WHERE plan_log_id = ?`,
        [shiftDate(log.created_at, deltaMs).toISOString(), log.plan_log_id],
      );
    }

    await run(db, 'COMMIT');

    console.log(
      JSON.stringify(
        {
          teacherId,
          subjectId: String(subjectId),
          oldPlanId: plan.plan_id,
          newPlanId: nextPlanId,
          oldStartDate: currentStartDate.toISOString(),
          newStartDate: targetDate.toISOString(),
          shiftedByDays: Math.round(deltaMs / (24 * 60 * 60 * 1000)),
        },
        null,
        2,
      ),
    );
  } catch (error) {
    try {
      await run(db, 'ROLLBACK');
    } catch {}

    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await close(db);
  }
}

main();
