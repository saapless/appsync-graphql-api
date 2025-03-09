import { FC, PropsWithChildren } from "react";
import Footer from "./footer";
import Header from "./header";

const Layout: FC<PropsWithChildren> = (props) => {
  return (
    <div className="w-full h-dvh flex flex-col">
      <Header />
      <main id="main-content" className="grow">
        {props.children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
