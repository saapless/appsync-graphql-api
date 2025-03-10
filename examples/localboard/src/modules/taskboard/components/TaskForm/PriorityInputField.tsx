import { Button } from "@/components/ui/button";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  PriorityPopover,
  PriorityPopoverContent,
  PriorityPopoverTrigger,
} from "@/modules/priority/components/PriorityPopover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronsUpDown } from "lucide-react";
import { ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form";
import { DynamicIcon, IconName } from "lucide-react/dynamic";

type PriorityInputFieldProps<TForm extends FieldValues, TName extends FieldPath<TForm>> = {
  field: ControllerRenderProps<TForm, TName>;
  onSelect(value: string): void;
};

function PriorityInputField<TForm extends FieldValues, TName extends FieldPath<TForm>>(
  props: PriorityInputFieldProps<TForm, TName>
) {
  const { field, onSelect } = props;

  return (
    <FormItem>
      <div className="flex gap-4 flex-row">
        <FormLabel className="w-[140px]">Priority:</FormLabel>
        <FormControl className="w-auto grow">
          <PriorityPopover>
            <PriorityPopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("grow justify-between", !field.value && "text-muted-foreground")}
              >
                Select priority
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PriorityPopoverTrigger>
            <PriorityPopoverContent className="w-[200px] p-0" align="start">
              {({ viewer }) => {
                return (
                  <Command>
                    <CommandInput placeholder="Search tag..." />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup>
                        {viewer.priorities.edges.map(
                          ({ node }) =>
                            node && (
                              <CommandItem
                                key={node?.id}
                                value={node.title ?? undefined}
                                onSelect={onSelect}
                              >
                                {node.icon ? (
                                  <DynamicIcon
                                    name={node.icon as IconName}
                                    className="mr-2 h-4 w-4 text-muted-foreground"
                                  />
                                ) : null}
                                {node.title}
                              </CommandItem>
                            )
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                );
              }}
            </PriorityPopoverContent>
          </PriorityPopover>
        </FormControl>
      </div>
      <FormMessage />
    </FormItem>
  );
}

export default PriorityInputField;
