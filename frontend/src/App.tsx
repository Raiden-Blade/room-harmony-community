import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { AppLayout } from "./layouts/AppLayout";
import { AboutPage } from "./pages/AboutPage";
import { CoordinateDetailPage } from "./pages/CoordinateDetailPage";
import { ExplorePage } from "./pages/ExplorePage";
import { HandoffPage } from "./pages/HandoffPage";
import { HomePage } from "./pages/HomePage";
import { PlanEditPage } from "./pages/PlanEditPage";
import { PlanPage } from "./pages/PlanPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { SavedPage } from "./pages/SavedPage";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/explore", element: <ExplorePage /> },
      { path: "/coordinates/:coordinateId", element: <CoordinateDetailPage /> },
      { path: "/products/:productId", element: <ProductDetailPage /> },
      { path: "/saved", element: <SavedPage /> },
      { path: "/plans/:planId", element: <PlanPage /> },
      { path: "/plans/:planId/edit", element: <PlanEditPage /> },
      { path: "/plans/:planId/handoff", element: <HandoffPage /> },
      { path: "/about", element: <AboutPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
