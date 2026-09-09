import { redirect } from "next/navigation";

export default function DistressSignalRedirect() {
  redirect("/technician/distress");
}