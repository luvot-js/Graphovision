import React from "react";
import { createBrowserRouter } from "react-router";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Test } from "./pages/Test";
import { Result } from "./pages/Result";
import { Compatibility } from "./pages/Compatibility";
import { Billing } from "./pages/Billing";
import { MyPage } from "./pages/MyPage";
import { HistoryDetail } from "./pages/HistoryDetail";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/test",
    element: <Test />,
  },
  {
    path: "/result/:id",
    element: <Result />,
  },
  {
    path: "/compatibility",
    element: <Compatibility />,
  },
  {
    path: "/billing",
    element: <Billing />,
  },
  {
    path: "/mypage",
    element: <MyPage />,
  },
  {
    path: "/mypage/history/:id",
    element: <HistoryDetail />,
  },
]);
