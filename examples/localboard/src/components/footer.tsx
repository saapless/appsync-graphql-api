import { FC } from "react";

const Footer: FC = () => {
  return (
    <footer className="py-3 bg-background text-muted-foreground text-sm shrink-0 border-t">
      <div className="container flex justify-center items-center">
        <p>Made with shadcn/ui</p>
      </div>
    </footer>
  );
};

export default Footer;
