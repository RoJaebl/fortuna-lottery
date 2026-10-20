import type { Route } from "next";
import { store } from "@lib/store";

declare module "@lib/store" {
  interface StoreRegistry {
    "route.home.index": () => Route;
  }
}

store.route("route.home.index", () => "/");
