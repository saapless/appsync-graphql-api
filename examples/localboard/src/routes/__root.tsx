import type { Environment } from "@/lib/relay";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import Layout from "@/components/layout";

interface RouterContext {
  environment: Environment;
}

function Root() {
  return (
    <Layout>
      <Outlet />
      <TanStackRouterDevtools />
    </Layout>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Root,
});
