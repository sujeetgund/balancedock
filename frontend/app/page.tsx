import { redirect } from "next/navigation";
import { getToken } from "@/lib/actions/auth";

export default async function Home() {
  const token = await getToken();

  if (token) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
