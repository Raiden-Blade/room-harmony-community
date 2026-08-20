import { createRoot } from "react-dom/client";

import { GlobalExperience } from "./global/GlobalExperience";
import "./global/global.css";

document.title = "Room Around 02 | 世界から暮らしをめぐる";

createRoot(document.getElementById("root")!).render(<GlobalExperience />);
