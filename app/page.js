import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SUPPLIER_TOKEN_COOKIE } from "@/lib/constants";

export default function Home() {
  const token = cookies().get(SUPPLIER_TOKEN_COOKIE)?.value;

  if (token) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
