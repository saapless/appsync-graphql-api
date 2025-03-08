import { routesIndexQuery } from "@/__generated__/routesIndexQuery.graphql";
import { HeroSection, HeroSectionDescription, HeroSectionHeading } from "@/components/hero-section";
import { TaskBoard } from "@/modules/taskboard";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { graphql, loadQuery, usePreloadedQuery } from "react-relay/hooks";

const query = graphql`
  query routesIndexQuery {
    viewer @required(action: THROW) {
      ...TaskBoard_data
    }
  }
`;

export const Route = createFileRoute("/")({
  component: PageComponent,
  loader: ({ context }) => loadQuery<routesIndexQuery>(context.environment, query, {}),
  wrapInSuspense: true,
});

function PageComponent() {
  const queryReference = Route.useLoaderData();
  const data = usePreloadedQuery<routesIndexQuery>(query, queryReference);

  return (
    <>
      <HeroSection>
        <HeroSectionHeading>Welcome to LocalBoard</HeroSectionHeading>
        <HeroSectionDescription>
          A simple, lightweight, task management tool that works fully in the browser.
        </HeroSectionDescription>
      </HeroSection>
      <Suspense>
        <section className="section">
          <div className="container">
            <TaskBoard data={data.viewer} />
          </div>
        </section>
      </Suspense>
    </>
  );
}
