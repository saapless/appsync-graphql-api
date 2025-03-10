import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { ComponentProps } from "react";
import { ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form";

type TitleInputFieldProps<TForm extends FieldValues, TName extends FieldPath<TForm>> = {
  field: ControllerRenderProps<TForm, TName>;
} & ComponentProps<typeof FormItem>;

function TitleInputField<TForm extends FieldValues, TName extends FieldPath<TForm>>(
  props: TitleInputFieldProps<TForm, TName>
) {
  const { field, ...rest } = props;

  return (
    <FormItem {...rest}>
      <div className="flex gap-4 flex-row items-baseline">
        <FormLabel className="w-[140px]">Title</FormLabel>
        <div className="w-auto grow">
          <FormControl>
            <Textarea
              rows={2}
              placeholder="My awesome task title"
              className="resize-none"
              {...field}
            />
          </FormControl>

          <FormMessage />
        </div>
      </div>
    </FormItem>
  );
}

export { TitleInputField };
