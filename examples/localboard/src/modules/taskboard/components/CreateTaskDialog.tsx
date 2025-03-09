import { useState, type FC } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import CreateTaskForm, { CreateTaskFormValues } from "./CreateTaskForm";
import { graphql, useMutation } from "react-relay/hooks";
import { CreateTaskInput } from "@/__generated__/CreateTaskDialogMutation.graphql";

const mutation = graphql`
  mutation CreateTaskDialogMutation($input: CreateTaskInput!, $connectionKeys: [ID!]!) {
    createTask(input: $input) @prependNode(connections: $connectionKeys, edgeTypeName: "TaskEdge") {
      id
      title
    }
  }
`;

type CreateTaskDialogProps = {
  connectionKeys: string[];
};

export const CreateTaskDialog: FC<CreateTaskDialogProps> = (props) => {
  const { connectionKeys } = props;
  const [commit] = useMutation(mutation);
  const [dialogOpen, setDialogOpen] = useState(false);

  const onSubmit = (values: CreateTaskFormValues) => {
    const timestamp = new Date().toISOString();

    const input = {
      id: crypto.randomUUID(),
      title: values.title,
      createdAt: timestamp,
      updatedAt: timestamp,
      statusId: values.statusId,
      priorityId: values.priorityId,
    } satisfies CreateTaskInput;

    commit({
      variables: { input, connectionKeys },
      onCompleted: (errors) => {
        if (errors) {
          console.error(errors);
        }
        setDialogOpen(false);
      },
    });
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button aria-label="Create new task">
          <PlusIcon />
          <span>New Task</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <CreateTaskForm onSubmit={onSubmit}>
          <DialogFooter className="flex flex-row justify-end items-center gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
            <Button size="sm">Create task</Button>
          </DialogFooter>
        </CreateTaskForm>
      </DialogContent>
    </Dialog>
  );
};
