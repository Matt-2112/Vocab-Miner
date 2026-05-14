import { auth } from "@/auth";
import GenerateForm from "./GenerateForm";

export default async function GeneratePage() {
  const session = await auth();
  const tier = session?.user.tier ?? "free";

  return <GenerateForm tier={tier} />;
}
