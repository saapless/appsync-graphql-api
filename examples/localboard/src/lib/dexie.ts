import { Dexie, EntityTable } from "dexie";
import { Node } from "../../__generated__/schema-types";
import { getRecords } from "../../data/seed";

export interface LocalBoardDB extends Dexie {
  records: EntityTable<Node, "id">;
}

const db = new Dexie("com.localboard.db") as LocalBoardDB;

// Schema declaration:
db.version(1).stores({
  records: "id, __typename, sourceId, targetId",
});

db.on("populate", (tx) => {
  const records = getRecords();
  tx.table("records").bulkAdd(records);
});

export default db;
