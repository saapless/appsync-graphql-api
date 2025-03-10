import type { FC, PropsWithChildren } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField } from "@/components/ui/form";
import { TitleInputField } from "./TitleInputField";
import PriorityInputField from "./PriorityInputField";
import StatusInputField from "./StatusInputField";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  statusId: z.string(),
  priorityId: z.string().optional(),
  dueDate: z.date().optional(),
  labels: z.array(z.string()).optional(),
});

export type TaskFormValues = z.infer<typeof schema>;

type CreateTaskFormProps = PropsWithChildren<{
  onSubmit: (values: TaskFormValues) => void | Promise<void>;
}>;

const TaskForm: FC<CreateTaskFormProps> = (props) => {
  const { onSubmit, children } = props;
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className=" flex flex-col gap-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => <TitleInputField field={field} />}
        />
        <FormField
          control={form.control}
          name="statusId"
          render={({ field }) => (
            <StatusInputField
              field={field}
              onSelect={(value) => form.setValue("statusId", value)}
            />
          )}
        />
        <FormField
          control={form.control}
          name="priorityId"
          render={({ field }) => (
            <PriorityInputField
              field={field}
              onSelect={(value) => form.setValue("statusId", value)}
            />
          )}
        />
        {children}
      </form>
    </Form>
  );
};

export { TaskForm };
