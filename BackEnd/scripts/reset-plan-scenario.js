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
      'node scripts/reset-plan-scenario.js --teacher <teacherId> --subject <subjectId> --target <YYYY-MM-DD|ISO>',
      '',
      'Example:',
      'node scripts/reset-plan-scenario.js --teacher user_12d073e4-0999-47f5-bef8-19a56abe9615 --subject 1 --target 2026-06-01',
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

function getPlanTimestamp(planId, startDate) {
  const parts = String(planId).split('_');
  const rawTimestamp = Number(parts[parts.length - 1]);

  if (!Number.isNaN(rawTimestamp) && rawTimestamp > 0) {
    return rawTimestamp;
  }

  return new Date(startDate).getTime();
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

function computeUsedDuration(items) {
  return items
    .filter((item) => String(item.status) !== 'Cancelled')
    .reduce((sum, item) => sum + Number(item.estimatedTime ?? 0), 0);
}

function toEmbeddedPlanItem(item) {
  if ('planItemId' in item) {
    return { ...item };
  }

  return {
    curriculumItemId: String(item.curriculum_item_id),
    subjectId: String(item.subject_id),
    planId: String(item.plan_id),
    sessionId: String(item.session_id),
    planItemId: String(item.plan_item_id),
    title: item.title,
    unitNo: Number(item.unit_no),
    lessonNo: Number(item.lesson_no),
    orderInLesson: Number(item.order_in_lesson),
    estimatedTime: Number(item.estimated_time),
    originalEstimatedTime:
      item.original_estimated_time == null
        ? null
        : Number(item.original_estimated_time),
    minEstimatedTime:
      item.min_estimated_time == null ? null : Number(item.min_estimated_time),
    priority: item.priority ?? null,
    isCompressible:
      item.is_compressible == null ? null : Boolean(Number(item.is_compressible)),
    status: item.status,
    originalSessionId: item.original_session_id ?? null,
    originalSessionOrder:
      item.original_session_order == null
        ? null
        : Number(item.original_session_order),
    carriedForwardCount:
      item.carried_forward_count == null
        ? 0
        : Number(item.carried_forward_count),
    notes: item.notes ?? null,
  };
}

function resetItemProgress(item, nextPlanId) {
  const embeddedItem = toEmbeddedPlanItem(item);

  return {
    ...embeddedItem,
    planId: nextPlanId,
    status: 'Planned',
    carriedForwardCount: 0,
    notes: null,
  };
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
    const nextPlanTimestamp = targetDate.getTime();
    const nextPlanId = buildPlanIdWithTimestamp(
      plan.plan_id,
      nextPlanTimestamp,
    );

    const planItems = await all(
      db,
      `
        SELECT *
        FROM plan_items
        WHERE plan_id = ?
        ORDER BY plan_item_id ASC
      `,
      [plan.plan_id],
    );

    const itemById = new Map(
      planItems.map((item) => [String(item.plan_item_id), item]),
    );

    const sessions = JSON.parse(plan.sessions_json);
    const updatedSessions = sessions.map((session) => {
      const shiftedSessionDate = shiftDate(session.sessionDate, deltaMs);
      const updatedItems = (session.items ?? []).map((embeddedItem) => {
        const tableItem = itemById.get(String(embeddedItem.planItemId));
        return resetItemProgress(tableItem ?? embeddedItem, nextPlanId);
      });

      return {
        ...session,
        planId: nextPlanId,
        sessionDate: shiftedSessionDate.toISOString(),
        items: updatedItems,
        usedDuration: computeUsedDuration(updatedItems),
      };
    });

    const updatedPlanJson = JSON.parse(plan.plan_json).map((sessionSummary) => ({
      ...sessionSummary,
      sessionDate: shiftDate(sessionSummary.sessionDate, deltaMs).toISOString(),
    }));

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
      `
        UPDATE plan_items
        SET plan_id = ?,
            status = 'Planned',
            carried_forward_count = 0,
            notes = NULL
        WHERE plan_id = ?
      `,
      [nextPlanId, plan.plan_id],
    );

    for (const session of updatedSessions) {
      await run(
        db,
        `
          UPDATE sessions
          SET session_date = ?,
              items_json = ?,
              used_duration = ?
          WHERE session_id = ?
        `,
        [
          session.sessionDate,
          JSON.stringify(session.items),
          Number(session.usedDuration ?? 0),
          session.sessionId,
        ],
      );
    }

    await run(db, `DELETE FROM plan_logs WHERE plan_id = ?`, [plan.plan_id]);

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
          updatedSessions: updatedSessions.length,
          resetPlanItems: planItems.length,
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
