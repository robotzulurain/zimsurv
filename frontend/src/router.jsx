import { createBrowserRouter } from "react-router-dom";
import Overview from "./pages/Overview";
import Trends from "./pages/Trends";
import Antibiogram from "./pages/Antibiogram";
import SexAge from "./pages/SexAge";
import Quality from "./pages/Quality";
import Geo from "./pages/Geo";
import DataEntry from "./pages/DataEntry";
import Settings from "./pages/Settings";

export const router = createBrowserRouter([
  { path: "/", element: <Overview/> },
  { path: "/trends", element: <Trends/> },
  { path: "/antibiogram", element: <Antibiogram/> },
  { path: "/sex-age", element: <SexAge/> },
  { path: "/quality", element: <Quality/> },
  { path: "/geo", element: <Geo/> },
  { path: "/data-entry", element: <DataEntry/> },
  { path: "/settings", element: <Settings/> },
]);
