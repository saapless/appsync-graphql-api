import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { PropsWithChildren } from "react";

type FacetedFilterCommand = PropsWithChildren<{
  hasFilters: boolean;
  onClear: () => void;
}>;

export function FacetedFilterCommand(props: FacetedFilterCommand) {
  const { children, hasFilters, onClear } = props;

  return (
    <Command>
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty className="text-muted-foreground">No results found.</CommandEmpty>
        <CommandGroup>{children}</CommandGroup>
        {hasFilters ? (
          <>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem onSelect={() => onClear()} className="justify-center text-center">
                Clear filters
              </CommandItem>
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </Command>
  );
}
