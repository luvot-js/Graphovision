import React from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";

export default function App() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-warm-gray/10">
      <div className="relative w-full max-w-[430px] bg-white shadow-xl min-h-screen">
        <RouterProvider router={router} />
      </div>
    </div>
  );
}
