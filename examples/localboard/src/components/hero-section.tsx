import { cn } from "@/lib/utils";

function HeroSection({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section className={cn("section", className)} {...props}>
      <div className="container flex flex-col items-start gap-1 py-8 md:py-10 lg:py-12">
        {children}
      </div>
    </section>
  );
}

function HeroSectionHeading({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        "text-2xl font-bold leading-tight tracking-tighter sm:text-3xl md:text-4xl lg:leading-[1.1]",
        className
      )}
      {...props}
    />
  );
}

function HeroSectionDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "max-w-2xl text-balance text-base font-light text-muted-foreground sm:text-lg",
        className
      )}
      {...props}
    />
  );
}

export { HeroSection, HeroSectionDescription, HeroSectionHeading };
