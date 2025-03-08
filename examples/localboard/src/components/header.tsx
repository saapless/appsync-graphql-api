import { FC } from "react";

const Header: FC = () => {
  return (
    <div className="flex justify-between py-3 bg-background border-b shrink-0">
      <div className="container flex justify-between items-center">
        <span className="font-semibold text-primary">LocalBoard</span>
      </div>
    </div>
  );
};

export default Header;
