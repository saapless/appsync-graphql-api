import { createRouter, RouterProvider } from "@tanstack/react-router";
import { RelayEnvironmentProvider } from "react-relay";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { environment } from "./lib/relay";
import { ThemeProvider } from "./providers/theme";

// Create a new router instance
const router = createRouter({ routeTree, context: { environment } });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  return (
    <RelayEnvironmentProvider environment={environment}>
      <ThemeProvider defaultTheme="dark">
        <RouterProvider router={router} />
      </ThemeProvider>
    </RelayEnvironmentProvider>
  );
}

export default App;
