import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";

function Root() {
  return (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  );
}

export const Route = createRootRoute({ component: Root });
