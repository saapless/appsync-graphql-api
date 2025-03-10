import { Button } from "@/components/ui/button";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  StatusNode,
  StatusPopover,
  StatusPopoverContent,
  StatusPopoverTrigger,
} from "@/modules/status/components/StatusPopover";
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
import { useState } from "react";

type StatusInputFieldProps<TForm extends FieldValues, TName extends FieldPath<TForm>> = {
  field: ControllerRenderProps<TForm, TName>;
  onSelect(value: string): void;
};

function StatusInputField<TForm extends FieldValues, TName extends FieldPath<TForm>>(
  props: StatusInputFieldProps<TForm, TName>
) {
  const [selected, setSelected] = useState<StatusNode>();
  const { field, onSelect } = props;

  const onSelectItem = (node: Required<StatusNode>) => {
    setSelected(node);
    onSelect(node?.id as string);
  };

  return (
    <FormItem>
      <div className="flex items-baseline gap-4 flex-row">
        <FormLabel className="w-[140px]">Status:</FormLabel>
        <div className="w-auto grow">
          <FormControl>
            <StatusPopover>
              <StatusPopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] grow justify-between",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {selected ? (
                    <div className="flex items-center">
                      {selected.icon ? (
                        <DynamicIcon
                          name={selected.icon as IconName}
                          className="mr-2 h-4 w-4 text-muted-foreground"
                        />
                      ) : null}
                      {selected.title}
                    </div>
                  ) : (
                    "Select status"
                  )}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </StatusPopoverTrigger>
              <StatusPopoverContent className="w-[200px] p-0" align="start">
                {({ viewer }, setOpen) => {
                  return (
                    <Command>
                      <CommandInput placeholder="Search tag..." />
                      <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                          {viewer.statuses.edges.map(
                            ({ node }) =>
                              node && (
                                <CommandItem
                                  key={node?.id}
                                  value={node.title ?? undefined}
                                  onSelect={() => {
                                    onSelectItem(node);
                                    setOpen(false);
                                  }}
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
              </StatusPopoverContent>
            </StatusPopover>
          </FormControl>
          <FormMessage />
        </div>
      </div>
    </FormItem>
  );
}

export default StatusInputField;
