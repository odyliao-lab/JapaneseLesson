import { takeSelectResult } from "./state.mjs";

function thenable(getRows) {
  const query = {
    from() {
      return query;
    },
    where() {
      return query;
    },
    orderBy() {
      return query;
    },
    innerJoin() {
      return query;
    },
    limit() {
      return query;
    },
    then(onFulfilled, onRejected) {
      try {
        return Promise.resolve(getRows()).then(onFulfilled, onRejected);
      } catch (error) {
        return Promise.reject(error).then(onFulfilled, onRejected);
      }
    },
  };
  return query;
}

function mutatingQuery(result = undefined) {
  const query = {
    values() {
      return query;
    },
    set() {
      return query;
    },
    where() {
      return query;
    },
    onConflictDoUpdate() {
      return query;
    },
    returning() {
      return Promise.resolve(result ?? [{}]);
    },
    then(onFulfilled, onRejected) {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
  };
  return query;
}

export function getDb() {
  return {
    select() {
      return thenable(() => takeSelectResult());
    },
    insert() {
      return mutatingQuery([{}]);
    },
    update() {
      return mutatingQuery();
    },
    delete() {
      return mutatingQuery();
    },
  };
}
