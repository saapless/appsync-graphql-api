import { PriorityFilterCommandItem_data$key } from "@/__generated__/PriorityFilterCommandItem_data.graphql";
import { CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { graphql, useFragment } from "react-relay/hooks";

const fragment = graphql`
  fragment PriorityFilterCommandItem_data on Priority {
    id
    title @required(action: THROW)
    icon
  }
`;

type PriorityFilterCommandItemProps = {
  facets: Map<string, number>;
  onSelect(value: string): void;
  isSelected: boolean;
  data: PriorityFilterCommandItem_data$key;
};

function PriorityFilterCommandItem(props: PriorityFilterCommandItemProps) {
  const { facets, isSelected, onSelect } = props;
  const node = useFragment(fragment, props.data);

  return (
    <CommandItem key={node.id} value={node.title} onSelect={() => onSelect(node.id)}>
      <div
        className={cn(
          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
          isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
        )}
      >
        <Check />
      </div>
      {node.icon ? (
        <DynamicIcon name={node.icon as IconName} className="mr-2 h-4 w-4 text-muted-foreground" />
      ) : null}
      <span>{node.title}</span>
      {facets.get(node.id) && (
        <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
          {facets.get(node.id)}
        </span>
      )}
    </CommandItem>
  );
}

export { PriorityFilterCommandItem };
