import { ComponentProps, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form";
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "./ui/form";
import { cn } from "@/lib/utils";
import { ChevronsUpDown } from "lucide-react";

type Option = {
  value: string;
  label: string;
};

type Orientation = "horizontal" | "vertical";

function isArrayValue(value: unknown): value is string[] {
  return Array.isArray(value);
}

type CompoboxInputFieldProps<TForm extends FieldValues, TName extends FieldPath<TForm>> = {
  label: string;
  placeholder?: string;
  description?: string;
  field: ControllerRenderProps<TForm, TName>;
  options: Option[];
  multiple?: boolean;
  orientation?: Orientation;
} & ComponentProps<typeof FormItem>;

function ComboboxInputField<TForm extends FieldValues, TName extends FieldPath<TForm>>(
  props: CompoboxInputFieldProps<TForm, TName>
) {
  const {
    label,
    placeholder,
    field,
    options,
    multiple,
    description,
    orientation = "horizontal",
    ...rest
  } = props;
  const [open, setOpen] = useState(false);

  const text = useMemo(() => {
    if (!field.value) return placeholder;

    if (multiple && isArrayValue(field.value) && field.value.length) {
      if (field.value.length < 2) {
        return options.find((option) => option.value === field.value[0])?.label;
      }

      return `${field.value.length} selected`;
    }

    return options.find((option) => option.value === field.value)?.label;
  }, [field.value, multiple, options, placeholder]);

  return (
    <FormItem {...rest}>
      <div className={cn("flex gap-4", orientation === "horizontal" ? "flex-row" : "flex-col")}>
        <FormLabel className="w-[140px]">{label}</FormLabel>
        <FormControl className="w-full">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("grow justify-between", !field.value && "text-muted-foreground")}
              >
                {text}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Command>
                <CommandInput placeholder="Search..." />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        // onSelect={(value) => {

                        // }}
                      >
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </FormControl>
      </div>
      {description ? <FormDescription>{description}</FormDescription> : null}
      <FormMessage />
    </FormItem>
  );
}

export { ComboboxInputField };
