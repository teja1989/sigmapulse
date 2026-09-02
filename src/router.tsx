import { createRouter } from "@tanstack/react-router";
import { DeskPending } from "@/components/DeskPending";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultPendingComponent: DeskPending,
    // Keep the current page up while a sector/tab fetch runs. A 0ms pending
    // swap was ripping out the menu and looking frozen on the phone.
    defaultPendingMs: 8_000,
    defaultPendingMinMs: 180,
    defaultStaleTime: 30_000,
    defaultGcTime: 120_000,
    defaultPreload: false,
  });
}
