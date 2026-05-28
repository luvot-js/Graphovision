import React from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Test } from "./pages/Test";
import { Result } from "./pages/Result";
import { Compatibility } from "./pages/Compatibility";
import { Billing } from "./pages/Billing";
import { MyPage } from "./pages/MyPage";
import { HistoryDetail } from "./pages/HistoryDetail";
import { isLoggedIn } from "../lib/auth";

function PrivateRoute({ element }: { element: React.ReactElement }) {
  return isLoggedIn() ? element : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  { path: "/",                    element: <Landing /> },
  { path: "/login",               element: <Login /> },
  { path: "/signup",              element: <Signup /> },
  { path: "/test",                element: <PrivateRoute element={<Test />} /> },
  { path: "/result/:id",          element: <PrivateRoute element={<Result />} /> },
  { path: "/compatibility",       element: <PrivateRoute element={<Compatibility />} /> },
  { path: "/billing",             element: <PrivateRoute element={<Billing />} /> },
  { path: "/mypage",              element: <PrivateRoute element={<MyPage />} /> },
  { path: "/mypage/history/:id",  element: <PrivateRoute element={<HistoryDetail />} /> },
]);
