import { Analytics } from "@vercel/analytics/react";
import XaePay from "./XaePay.jsx";

export default function App() {
  return (
    <>
      <XaePay />
      <Analytics />
    </>
  );
}
