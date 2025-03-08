import { Dexie, EntityTable } from "dexie";
import { Node, User, Viewer, Workspace } from "../../__generated__/schema-types";

export interface LocalBoardDB extends Dexie {
  records: EntityTable<Node, "id">;
}

const db = new Dexie("com.localboard.db") as LocalBoardDB;

// Schema declaration:
db.version(1).stores({
  records: "id, __typename, sourceId, targetId",
});

db.on("populate", (tx) => {
  const timestamp = new Date().toISOString();

  const user = {
    id: crypto.randomUUID(),
    firstName: "Finn",
    lastName: "Sparklewood",
    email: "finn.sparky87@saapless.com",
    createdAt: timestamp,
    updatedAt: timestamp,
    __typename: "User",
  } satisfies User;

  const workspace = {
    id: crypto.randomUUID(),
    name: "SparkleTech HQ",
    userId: user.id,
    createdAt: timestamp,
    updatedAt: timestamp,
    __typename: "Workspace",
  } satisfies Workspace;

  const viewer = {
    id: "root:viewer:id",
    userId: user.id,
    workspaceId: workspace.id,
  } satisfies Viewer;

  tx.table("records").bulkAdd([user, workspace, viewer]);
});

export default db;
