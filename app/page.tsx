import Homepage from "@/app/(homepage)/Homepage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Codebreakers Blog",
  description: "A platform for sharing knowledge and insights",
};

export default function Page() {
  return <Homepage />;
}
