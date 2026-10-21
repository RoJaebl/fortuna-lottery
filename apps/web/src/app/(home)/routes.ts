import type { Route } from "next";
import { store } from "@framework";

declare module "@lib/store" {
  interface StoreRegistry {
    "route.home.index": () => Route;
  }
}

store.route("route.home.index", () => "/");
