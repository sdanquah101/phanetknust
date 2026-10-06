import { redirect } from "next/navigation";
import { ACADEMY_URL } from "@/lib/links";

export default function AcademyRedirect() {
  redirect(ACADEMY_URL);
}
