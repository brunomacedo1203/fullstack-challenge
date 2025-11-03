import {
  TaskCommentCreatedEvent,
  TaskCreatedEvent,
  TaskEvent,
  TaskUpdatedEvent,
} from '@jungle/types';

const MAX_STRING_LENGTH = 10_000;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isString = (value: unknown, allowEmpty = true): value is string =>
  typeof value === 'string' &&
  (allowEmpty || value.length > 0) &&
  value.length <= MAX_STRING_LENGTH;

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new InvalidTaskEventError(message);
  }
};

const asString = (value: unknown, field: string, allowEmpty = true): string => {
  assert(isString(value, allowEmpty), `${field} must be a string`);
  return value as string;
};

const asOptionalString = (value: unknown, field: string): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return asString(value, field);
};

const asNullableString = (value: unknown, field: string): string | null | undefined => {
  if (value === null) {
    return null;
  }

  return asOptionalString(value, field);
};

const asStringArray = (value: unknown, field: string): string[] => {
  assert(Array.isArray(value), `${field} must be an array`);
  const result: string[] = [];

  for (const item of value as unknown[]) {
    result.push(asString(item, `${field} item`));
  }

  return result;
};

const asChangedFields = (value: unknown): Record<string, { from: unknown; to: unknown }> => {
  assert(isObject(value), 'payload.changedFields must be an object');

  const result: Record<string, { from: unknown; to: unknown }> = {};
  const entries = Object.entries(value as Record<string, unknown>);

  for (const [field, rawChange] of entries) {
    assert(isObject(rawChange), `payload.changedFields.${field} must be an object`);

    const changeRecord = rawChange as Record<string, unknown>;
    assert('from' in changeRecord, `payload.changedFields.${field} must contain "from"`);
    assert('to' in changeRecord, `payload.changedFields.${field} must contain "to"`);

    const { from, to } = changeRecord as { from: unknown; to: unknown };
    result[field] = { from, to };
  }

  return result;
};

export class InvalidTaskEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTaskEventError';
  }
}

const validateBaseFields = (value: Record<string, unknown>): void => {
  asString(value.taskId, 'taskId');
  asString(value.occurredAt, 'occurredAt');
  asOptionalString(value.actorId, 'actorId');
};

const normalizeTaskCreated = (event: Record<string, unknown>): TaskCreatedEvent => {
  validateBaseFields(event);

  assert(isObject(event.payload), 'payload must be an object');

  const payload = event.payload as Record<string, unknown>;
  const normalizedPayload: TaskCreatedEvent['payload'] = {
    title: asString(payload.title, 'payload.title'),
    description: asNullableString(payload.description, 'payload.description'),
    status: asString(payload.status, 'payload.status'),
    priority: asString(payload.priority, 'payload.priority'),
    dueDate: asNullableString(payload.dueDate, 'payload.dueDate'),
    assigneeIds: asStringArray(payload.assigneeIds, 'payload.assigneeIds'),
  };

  return {
    type: 'task.created',
    taskId: asString(event.taskId, 'taskId'),
    occurredAt: asString(event.occurredAt, 'occurredAt'),
    actorId: asOptionalString(event.actorId, 'actorId'),
    payload: normalizedPayload,
  };
};

const normalizeTaskUpdated = (event: Record<string, unknown>): TaskUpdatedEvent => {
  validateBaseFields(event);

  assert(isObject(event.payload), 'payload must be an object');

  const payload = event.payload as Record<string, unknown>;
  const normalizedPayload: TaskUpdatedEvent['payload'] = {
    changedFields: asChangedFields(payload.changedFields),
    status: asString(payload.status, 'payload.status'),
    priority: asString(payload.priority, 'payload.priority'),
    dueDate: asNullableString(payload.dueDate, 'payload.dueDate'),
    assigneeIds: asStringArray(payload.assigneeIds, 'payload.assigneeIds'),
  };

  return {
    type: 'task.updated',
    taskId: asString(event.taskId, 'taskId'),
    occurredAt: asString(event.occurredAt, 'occurredAt'),
    actorId: asOptionalString(event.actorId, 'actorId'),
    payload: normalizedPayload,
  };
};

const normalizeTaskCommentCreated = (event: Record<string, unknown>): TaskCommentCreatedEvent => {
  validateBaseFields(event);

  assert(isObject(event.payload), 'payload must be an object');

  const payload = event.payload as Record<string, unknown>;
  const normalizedPayload: TaskCommentCreatedEvent['payload'] = {
    commentId: asString(payload.commentId, 'payload.commentId'),
    authorId: asOptionalString(payload.authorId, 'payload.authorId'),
    content: asString(payload.content, 'payload.content', false),
  };

  return {
    type: 'task.comment.created',
    taskId: asString(event.taskId, 'taskId'),
    occurredAt: asString(event.occurredAt, 'occurredAt'),
    actorId: asOptionalString(event.actorId, 'actorId'),
    payload: normalizedPayload,
  };
};

export const parseTaskEvent = (routingKey: string, rawPayload: string): TaskEvent => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawPayload);
  } catch (error) {
    throw new InvalidTaskEventError(
      `Invalid JSON payload: ${(error as Error).message ?? 'unexpected error'}`,
    );
  }

  assert(isObject(parsed), 'Event payload must be an object');

  const event = parsed as Record<string, unknown>;

  assert(isString(event.type), 'Event type must be a string');
  assert(
    event.type === routingKey,
    `Routing key ${routingKey} does not match event type ${event.type}`,
  );

  switch (event.type) {
    case 'task.created':
      return normalizeTaskCreated(event);
    case 'task.updated':
      return normalizeTaskUpdated(event);
    case 'task.comment.created':
      return normalizeTaskCommentCreated(event);
    default:
      throw new InvalidTaskEventError(`Unsupported event type: ${event.type}`);
  }
};
