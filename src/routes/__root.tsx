import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";

const APP_NAME = "Meduza";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
    ],
    links: [
      { rel: "icon", href: "/meduza-logo.jpg" },
    ],
  }),
  component: () => (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  ),
});
