import { TaskBoard_data$key } from "@/__generated__/TaskBoard_data.graphql";
import type { FC } from "react";
import { ConnectionHandler, graphql, useFragment } from "react-relay/hooks";
import { TaskTable } from "./TaskTable";
import { CreateTaskDialog } from "./CreateTaskDialog";

const fragment = graphql`
  fragment TaskBoard_data on Viewer {
    __id
    user @required(action: THROW) {
      id
      firstName
    }
    ...TaskTable_data
  }
`;

type TaskBoardProps = {
  data: TaskBoard_data$key;
};

export const TaskBoard: FC<TaskBoardProps> = (props) => {
  const data = useFragment(fragment, props.data);

  return (
    <div className="flex h-full flex-1 flex-col space-y-8 p-8 rounded-[0.5rem] border bg-background shadow">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hi, {data.user.firstName}</h2>
          <p className="text-muted-foreground">Here&apos;s a list of your tasks for this month!</p>
        </div>
        <div>
          <CreateTaskDialog
            connectionKeys={[ConnectionHandler.getConnectionID(data.__id, "TaskTable_tasks")]}
          />
        </div>
      </div>
      <TaskTable data={data} />
    </div>
  );
};
