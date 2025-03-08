import type { FC, PropsWithChildren } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField } from "@/components/ui/form";
import { TextInputField } from "@/components/text-input-field";
import { ComboboxInputField } from "@/components/combobox-input-field";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  statusId: z.string(),
  priorityId: z.string().optional(),
  dueDate: z.date().optional(),
  labels: z.array(z.string()).optional(),
});

export type CreateTaskFormValues = z.infer<typeof schema>;

type CreateTaskFormProps = PropsWithChildren<{
  onSubmit: (values: CreateTaskFormValues) => void | Promise<void>;
}>;

const CreateTaskForm: FC<CreateTaskFormProps> = (props) => {
  const { onSubmit, children } = props;
  const form = useForm<CreateTaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="my-4 flex flex-col gap-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <TextInputField field={field} label="Title" placeholder="My awesome task title" />
          )}
        />
        <FormField
          control={form.control}
          name="statusId"
          render={({ field }) => (
            <ComboboxInputField
              field={field}
              label="Status"
              placeholder="Select status"
              options={[]}
            />
          )}
        />
        <FormField
          control={form.control}
          name="priorityId"
          render={({ field }) => (
            <ComboboxInputField
              field={field}
              label="Priority"
              placeholder="Select priority"
              options={[]}
            />
          )}
        />
        {children}
      </form>
    </Form>
  );
};

export default CreateTaskForm;
