"use client";

import TestPage from "../test/page";

// Keep the demo route as a stable alias for the maintained test surface.
// The old wrapper imported a route module's internal component and broke
// Next's generated page types whenever that page changed.
export default TestPage;
