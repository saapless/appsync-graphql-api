import { ComponentProps } from "react";
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form";

type TextInputFieldProps<TForm extends FieldValues, TName extends FieldPath<TForm>> = {
  label: string;
  placeholder?: string;
  description?: string;
  field: ControllerRenderProps<TForm, TName>;
} & ComponentProps<typeof FormItem>;

function TextInputField<TForm extends FieldValues, TName extends FieldPath<TForm>>(
  props: TextInputFieldProps<TForm, TName>
) {
  const { label, description, placeholder, field, ...rest } = props;

  return (
    <FormItem {...rest}>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <Input placeholder={placeholder} {...field} />
      </FormControl>
      {description ? <FormDescription>{description}</FormDescription> : null}
      <FormMessage />
    </FormItem>
  );
}

export { TextInputField };
